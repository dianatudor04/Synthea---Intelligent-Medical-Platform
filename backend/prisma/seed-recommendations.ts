/**
 * Seeds curated recommendation pools and a handful of demo patients with mock
 * medical documents, then runs the personalization pipeline (embed → extract
 * signals → generate recommendations) for them so the system has real,
 * end-to-end demo data.
 *
 * Run: npm run seed:reco   (needs the stack up + OPENROUTER_API_KEY)
 * Idempotent: re-running replaces seeded pools' items and the demo patients'
 * seeded documents / signals / recommendations.
 */
import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/config/database';
import { logger } from '../src/config/logger';
import { embedDocument } from '../src/services/document-embedding.service';
import { extractSignalsForDocument } from '../src/services/signal.service';
import { generateForUser } from '../src/services/recommendation.service';

type ItemSeed = { adviceText: string; ctaLabel: string; ctaUrl: string };
type PoolSeed = { tag: string; title: string; description: string; items: ItemSeed[] };

const POOLS: PoolSeed[] = [
  {
    tag: 'lower_back_pain',
    title: 'Lower back care',
    description: 'Curated guidance for managing and preventing lower back pain.',
    items: [
      {
        adviceText:
          'Gentle daily mobility — short walks and core-stabilising stretches — is one of the most effective ways to ease mechanical lower back pain. Avoid prolonged sitting and heavy lifting while symptoms persist.',
        ctaLabel: 'Read: Benefits of Daily Exercise',
        ctaUrl: '/patient/blog',
      },
      {
        adviceText:
          'Persistent or worsening back pain deserves a professional assessment. A physiotherapy consultation can tailor exercises to your situation.',
        ctaLabel: 'Book a consultation',
        ctaUrl: '/patient/appointments',
      },
    ],
  },
  {
    tag: 'prediabetes',
    title: 'Prediabetes & blood sugar',
    description: 'Lifestyle guidance for elevated blood sugar / prediabetes.',
    items: [
      {
        adviceText:
          'Prediabetes is often reversible. Reducing refined carbohydrates, adding fibre-rich vegetables, and 30 minutes of daily activity can meaningfully lower fasting glucose. Re-check your levels with your doctor.',
        ctaLabel: 'Read: Balanced Diet Essentials',
        ctaUrl: '/patient/blog',
      },
    ],
  },
  {
    tag: 'type_2_diabetes',
    title: 'Type 2 diabetes support',
    description: 'Support content for managing type 2 diabetes.',
    items: [
      {
        adviceText:
          'Consistent meal timing, monitoring your blood sugar, and regular movement help keep type 2 diabetes well controlled. Discuss a monitoring plan with your care team.',
        ctaLabel: 'Book a check-up',
        ctaUrl: '/patient/appointments',
      },
    ],
  },
  {
    tag: 'hypertension',
    title: 'Blood pressure management',
    description: 'Guidance for managing elevated blood pressure.',
    items: [
      {
        adviceText:
          'Lowering salt intake, staying active, and managing stress all help control blood pressure. If you monitor at home, keep a log to share with your doctor.',
        ctaLabel: 'Read: Heart-Healthy Foods',
        ctaUrl: '/patient/blog',
      },
    ],
  },
  {
    tag: 'high_cholesterol',
    title: 'Cholesterol & heart health',
    description: 'Curated heart-health guidance for elevated cholesterol.',
    items: [
      {
        adviceText:
          'Swapping saturated fats for sources like olive oil, nuts, and oily fish supports healthier cholesterol levels. Pair dietary changes with regular activity.',
        ctaLabel: 'Read: Heart-Healthy Foods',
        ctaUrl: '/patient/blog',
      },
    ],
  },
  {
    tag: 'anxiety',
    title: 'Managing anxiety',
    description: 'Evidence-informed self-care for anxiety and stress.',
    items: [
      {
        adviceText:
          'Simple daily practices — paced breathing, a consistent sleep schedule, and brief mindfulness — can reduce anxiety over time. If anxiety affects daily life, a professional can help.',
        ctaLabel: 'Read: Managing Stress & Anxiety',
        ctaUrl: '/patient/blog',
      },
    ],
  },
  {
    tag: 'asthma',
    title: 'Living well with asthma',
    description: 'Practical guidance for asthma control.',
    items: [
      {
        adviceText:
          'Knowing your triggers, keeping your reliever inhaler accessible, and following your asthma action plan are key to staying in control. Review your plan with your doctor periodically.',
        ctaLabel: 'Book a review',
        ctaUrl: '/patient/appointments',
      },
    ],
  },
  {
    tag: 'weight_management',
    title: 'Healthy weight',
    description: 'Sustainable, non-judgemental weight-management guidance.',
    items: [
      {
        adviceText:
          'Small, sustainable changes beat crash diets: balanced plates, mindful portions, and enjoyable activity you can keep up. Progress is gradual — be kind to yourself.',
        ctaLabel: 'Read: Active Lifestyle Benefits',
        ctaUrl: '/patient/blog',
      },
    ],
  },
];

type PatientSeed = { email: string; fileName: string; text: string };

const PATIENTS: PatientSeed[] = [
  {
    email: 'demo.maria.popescu@synthea.ro',
    fileName: 'seed-scrisoare-medicala.txt',
    text: `Scrisoare medicală. Pacienta acuză durere lombară cronică de aproximativ două luni,
accentuată la efort și la ridicarea de greutăți. Diagnostic prezumtiv: lombalgie mecanică.
Glicemia à jeun este 138 mg/dl, sugerând prediabet. Indice de masă corporală crescut.
Se recomandă fizioterapie pentru zona lombară, dietă echilibrată și scădere în greutate.`,
  },
  {
    email: 'demo.ion.constantin@synthea.ro',
    fileName: 'seed-evaluare-cardiologica.txt',
    text: `Evaluare cardiologică. Tensiune arterială măsurată 152/96 mmHg, valori crescute repetate.
Colesterol total 245 mg/dl, LDL crescut. Se recomandă reducerea consumului de sare,
activitate fizică regulată și dietă cu grăsimi sănătoase. Reevaluare peste o lună.`,
  },
  {
    email: 'demo.elena.vasilescu@synthea.ro',
    fileName: 'seed-consult-psihologic.txt',
    text: `Notă de consult. Pacienta descrie anxietate persistentă, neliniște și dificultăți de somn
în ultimele săptămâni, pe fond de stres profesional. Fără ideație suicidară. Se recomandă
tehnici de respirație, igiena somnului și exerciții de mindfulness; eventual consiliere.`,
  },
  {
    email: 'demo.andrei.marinescu@synthea.ro',
    fileName: 'seed-pneumologie.txt',
    text: `Consult pneumologie. Pacientul are astm bronșic diagnosticat, folosește inhalator de criză.
Episoade de respirație șuierătoare declanșate de alergeni și efort. Se recomandă evitarea
alergenilor, plan de acțiune pentru astm și monitorizarea simptomelor respiratorii.`,
  },
];

async function seedPools() {
  for (const p of POOLS) {
    const pool = await prisma.pool.upsert({
      where: { tag: p.tag },
      create: { tag: p.tag, title: p.title, description: p.description, active: true },
      update: { title: p.title, description: p.description, active: true },
    });
    // Replace items so re-runs stay deterministic.
    await prisma.poolItem.deleteMany({ where: { poolId: pool.id } });
    await prisma.poolItem.createMany({
      data: p.items.map((it) => ({ poolId: pool.id, ...it, active: true })),
    });
  }
  logger.info(`[seed] ${POOLS.length} pools seeded`);
}

async function seedPatient(p: PatientSeed) {
  const user = await prisma.user.findUnique({
    where: { email: p.email },
    select: { id: true, patientProfile: { select: { id: true } } },
  });
  if (!user?.patientProfile) {
    logger.warn(`[seed] ${p.email}: no patient profile, skipping`);
    return;
  }
  const userId = user.id;
  const patientId = user.patientProfile.id;

  // Turn on consent for the demo so the pipeline is allowed to run.
  await prisma.userConsent.upsert({
    where: { userId },
    create: { userId, analytics: true, profiling: true, marketingEmail: true },
    update: { analytics: true, profiling: true, marketingEmail: true },
  });

  // Clean prior seeded docs + recommendations for a deterministic re-run.
  await prisma.ocrDocument.deleteMany({ where: { patientId, fileName: { startsWith: 'seed-' } } });
  await prisma.recommendation.deleteMany({ where: { userId } });

  const doc = await prisma.ocrDocument.create({
    data: {
      patientId,
      fileName: p.fileName,
      source: 'PATIENT_UPLOAD',
      processed: true,
      extractedText: p.text,
    },
    select: { id: true },
  });

  await embedDocument(doc.id);
  const signals = await extractSignalsForDocument(userId, doc.id);
  const recs = await generateForUser(userId);
  logger.info(`[seed] ${p.email}: ${signals} signals, ${recs} recommendations`);
}

async function main() {
  await seedPools();
  for (const p of PATIENTS) await seedPatient(p);
  await prisma.$disconnect();
  logger.info('[seed] done');
  process.exit(0);
}

main().catch((e) => {
  logger.error('[seed] failed', { error: e });
  process.exit(1);
});
