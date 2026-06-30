import { PrismaClient, Prisma, Role, Gender, AppointmentStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PWD_ADMIN = 'Admin@1234!';
const PWD_DOCTOR = 'Doctor@1234!';
const PWD_PATIENT = 'Patient@1234!';
const PWD_NURSE = 'Nurse@1234!';

// ─── Source pools ────────────────────────────────────────────────────

const SPECIALTIES = [
  // Original 15 specialties (48 doctors)
  { name: 'Cardiologie', bio: 'Specialist diagnostic și tratament cardiovascular.', baseFee: 280, count: 4 },
  { name: 'Dermatologie', bio: 'Tratamentul afecțiunilor pielii și mucoaselor.', baseFee: 220, count: 3 },
  { name: 'Endocrinologie', bio: 'Specialist diabet și boli metabolice.', baseFee: 240, count: 3 },
  { name: 'Gastroenterologie', bio: 'Diagnostic afecțiuni ale tractului digestiv.', baseFee: 250, count: 3 },
  { name: 'Medicină Generală', bio: 'Consultații generale și triaj inițial.', baseFee: 150, count: 4 },
  { name: 'Ginecologie', bio: 'Sănătatea reproductivă feminină.', baseFee: 230, count: 3 },
  { name: 'ORL', bio: 'Otorinolaringologie - urechi, nas, gât.', baseFee: 200, count: 3 },
  { name: 'Neurologie', bio: 'Diagnostic și tratament boli neurologice.', baseFee: 270, count: 3 },
  { name: 'Oncologie', bio: 'Diagnostic și tratament oncologic.', baseFee: 320, count: 3 },
  { name: 'Oftalmologie', bio: 'Sănătatea ochilor și a vederii.', baseFee: 210, count: 3 },
  { name: 'Ortopedie', bio: 'Afecțiuni ale aparatului locomotor.', baseFee: 260, count: 3 },
  { name: 'Pediatrie', bio: 'Sănătatea copiilor de la 0 la 18 ani.', baseFee: 200, count: 4 },
  { name: 'Psihiatrie', bio: 'Sănătate mintală și psihiatrie clinică.', baseFee: 280, count: 3 },
  { name: 'Pneumologie', bio: 'Boli pulmonare și respiratorii.', baseFee: 240, count: 3 },
  { name: 'Urologie', bio: 'Aparatul urinar și genital masculin.', baseFee: 250, count: 3 },

  // 10 additional specialties (30 doctors, 3 each)
  { name: 'Reumatologie', bio: 'Specialist boli reumatismale, autoimune și ale articulațiilor.', baseFee: 230, count: 3 },
  { name: 'Nefrologie', bio: 'Diagnostic și tratament al bolilor renale și dializă.', baseFee: 270, count: 3 },
  { name: 'Hematologie', bio: 'Diagnostic și tratament al bolilor sângelui.', baseFee: 290, count: 3 },
  { name: 'Alergologie', bio: 'Diagnostic și tratament al alergiilor și imunodeficiențelor.', baseFee: 220, count: 3 },
  { name: 'Chirurgie Generală', bio: 'Intervenții chirurgicale generale și abdominale.', baseFee: 350, count: 3 },
  { name: 'Radiologie', bio: 'Imagistică medicală - radiografii, CT, RMN, ecografii.', baseFee: 200, count: 3 },
  { name: 'Medicină de Urgență', bio: 'Tratamentul urgențelor medicale și stabilizare.', baseFee: 230, count: 3 },
  { name: 'Boli Infecțioase', bio: 'Diagnostic și tratament al bolilor infecțioase și parazitare.', baseFee: 240, count: 3 },
  { name: 'Geriatrie', bio: 'Sănătatea persoanelor vârstnice și boli ale îmbătrânirii.', baseFee: 220, count: 3 },
  { name: 'Chirurgie Plastică', bio: 'Chirurgie estetică, reconstructivă și a mâinii.', baseFee: 380, count: 3 },
];
// Total doctors across specialties = 78 (25 specialties, ≥ 2 per specialty, ≥ 40 overall).

const FIRST_M = ['Andrei','Mihai','Vlad','Alexandru','Cristian','Florin','George','Radu','Sorin','Tudor','Adrian','Bogdan','Cătălin','Eduard','Gabriel','Horia','Lucian','Marius','Nicolae','Octavian','Paul','Răzvan','Stefan','Teodor','Victor'];
const FIRST_F = ['Ana','Maria','Elena','Ioana','Andreea','Cristina','Diana','Laura','Mihaela','Roxana','Simona','Ștefania','Adriana','Bianca','Camelia','Daniela','Gabriela','Iulia','Lavinia','Monica','Nicoleta','Oana','Patricia','Raluca','Sabina'];
const LAST = ['Popescu','Ionescu','Pop','Rusu','Stoica','Stan','Dumitru','Munteanu','Diaconu','Gheorghe','Constantin','Marin','Petrescu','Florea','Vlad','Mocanu','Dragomir','Lupu','Andrei','Olteanu','Manea','Voicu','Bădescu','Tudose','Crăciun','Călin','Pascu','Coman','Toma','Dinu','Ungureanu','Sandu','Niță','Oprea'];

const ALLERGIES = ['Penicillin','Peanuts','Tree nuts','Shellfish','Eggs','Milk','Soy','Wheat','Fish','Latex','Aspirin','Ibuprofen','Sulfa drugs','Pollen'];
const BLOOD = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const CITIES = ['București','Cluj-Napoca','Iași','Timișoara','Brașov','Constanța','Sibiu','Oradea','Galați','Ploiești'];

// ─── Romanian-realistic field generators (CNP, address, insurance, contacts) ──
// County (județ) code = digits 7-8 of the CNP, derived from the patient's city.
const CITY_COUNTY: Record<string, string> = {
  'București': '40', 'Cluj-Napoca': '12', 'Iași': '22', 'Timișoara': '35',
  'Brașov': '08', 'Constanța': '13', 'Sibiu': '32', 'Oradea': '05',
  'Galați': '17', 'Ploiești': '29',
};
const STREET_TYPES = ['Str.', 'Bd.', 'Aleea', 'Calea'];
const STREETS = ['Aviatorilor','Unirii','Victoriei','Mihai Eminescu','Ion Creangă','Libertății','Primăverii','Castanilor','Crișan','Horea','Decebal','Traian','Ștefan cel Mare','Mircea cel Bătrân','Avram Iancu','Nicolae Bălcescu','Gheorghe Doja','Rozelor','Salcâmilor','Teilor'];
const RELATIONS = ['soț','soție','fiu','fiică','frate','soră','părinte','rudă'];

// Global running sequence so every generated CNP is unique (cnp is @unique).
// Stays < 999 for the demo population, fitting the 3-digit CNP order number.
let cnpSeq = 0;

// CNP control key + checksum digit (digit 13).
function cnpChecksum(d12: string): string {
  const key = '279146358279';
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d12[i]) * Number(key[i]);
  const r = sum % 11;
  return String(r === 10 ? 1 : r);
}

// Valid 13-digit CNP consistent with the patient's gender, birth date and county.
function generateCNP(gender: Gender, dob: Date, city: string): string {
  const year = dob.getFullYear();
  const s = year >= 2000 ? (gender === Gender.FEMALE ? 6 : 5) : (gender === Gender.FEMALE ? 2 : 1);
  const yy = String(year % 100).padStart(2, '0');
  const mm = String(dob.getMonth() + 1).padStart(2, '0');
  const dd = String(dob.getDate()).padStart(2, '0');
  const county = CITY_COUNTY[city] ?? '40';
  const nnn = String((cnpSeq++ % 999) + 1).padStart(3, '0');
  const d12 = `${s}${yy}${mm}${dd}${county}${nnn}`;
  return d12 + cnpChecksum(d12);
}

function generateAddress(seed: number): string {
  const t = STREET_TYPES[seed % STREET_TYPES.length];
  const street = STREETS[(seed * 7) % STREETS.length];
  const nr = 1 + ((seed * 13) % 180);
  const bl = 1 + (seed % 40);
  const ap = 1 + ((seed * 3) % 60);
  return `${t} ${street} nr. ${nr}, bl. ${bl}, ap. ${ap}`;
}

function generateInsuranceNo(city: string, seed: number): string {
  const county = CITY_COUNTY[city] ?? '40';
  return `CAS-${county}-${String(100000 + ((seed * 37) % 900000)).padStart(6, '0')}`;
}

function generateEmergencyContact(seed: number): string {
  const isMale = seed % 2 === 0;
  const first = isMale ? FIRST_M[(seed * 3) % FIRST_M.length] : FIRST_F[(seed * 3) % FIRST_F.length];
  const last = LAST[(seed * 5) % LAST.length];
  const rel = RELATIONS[seed % RELATIONS.length];
  const phone = `+407${String(55000000 + ((seed * 7) % 4000000)).padStart(8, '0')}`;
  return `${first} ${last} (${rel}) — ${phone}`;
}

const REVIEW_COMMENTS_POSITIVE: (string | null)[] = [
  'Medic profesionist și empatic. Recomand cu încredere!',
  'Am primit explicații clare și un tratament eficient.',
  'Punctual, atent la detalii. O experiență plăcută.',
  'Mi-a explicat totul pe înțeles. Foarte răbdător.',
  'Comunicare excelentă, mă simt ascultată.',
  'Tratament eficient, simptomele s-au ameliorat rapid.',
  null,
  'Atmosferă plăcută la cabinet, personal amabil.',
  'A pus diagnosticul corect din prima consultație.',
  null,
  'Foarte mulțumit de experiență. Voi reveni cu siguranță.',
  'Profesionist serios și empatic, recomand!',
];

const REVIEW_COMMENTS_NEUTRAL: (string | null)[] = [
  'Consultație ok, dar timp puțin de discuție.',
  'Am așteptat destul de mult la programare. Medicul a fost ok.',
  'Răspunde clar la întrebări. Cabinet curat.',
  'Bun specialist, dar pare grăbit.',
  'Diagnosticul a fost corect, totuși comunicarea ar putea fi mai prietenoasă.',
  null,
  'Experiență neutră, nimic deosebit.',
  'Tratamentul a funcționat parțial.',
  'Ok, dar prețul mi s-a părut mare.',
];

const REVIEW_COMMENTS_NEGATIVE: (string | null)[] = [
  'Așteptare lungă și consultație scurtă.',
  'Nu am primit suficiente explicații despre tratament.',
  'Personalul de la recepție a fost nepoliticos.',
  'Aș fi vrut o abordare mai empatică.',
  null,
];

// ─── Services per specialty ──────────────────────────────────────────
// Every specialty gets the universal set (5 services). Some specialties
// also get specialty-specific extras (procedures, imaging, etc.) for more variety.

type ServiceSpec = { name: string; description: string; durationMin: number; basePrice: number };

const universalServices = (baseFee: number): ServiceSpec[] => [
  {
    name: 'Consultație inițială',
    description: 'Prima evaluare medicală completă — anamneză, examen clinic și plan de investigații.',
    durationMin: 45,
    basePrice: baseFee,
  },
  {
    name: 'Consultație de control',
    description: 'Reevaluare după un tratament sau o intervenție anterioară.',
    durationMin: 20,
    basePrice: Math.round(baseFee * 0.7),
  },
  {
    name: 'Reevaluare tratament',
    description: 'Ajustarea schemei terapeutice în funcție de evoluție.',
    durationMin: 30,
    basePrice: Math.round(baseFee * 0.8),
  },
  {
    name: 'Telemedicină (consultație online)',
    description: 'Discuție video cu medicul, ideală pentru reevaluări sau a doua opinie.',
    durationMin: 30,
    basePrice: Math.round(baseFee * 0.75),
  },
  {
    name: 'Eliberare rețetă / aviz medical',
    description: 'Reînnoire rețetă, recomandări medicale sau avizare documente.',
    durationMin: 15,
    basePrice: Math.round(baseFee * 0.5),
  },
];

const SPECIALTY_EXTRAS: Record<string, ServiceSpec[]> = {
  Cardiologie: [
    { name: 'ECG (electrocardiogramă)', description: 'Înregistrarea activității electrice a inimii.', durationMin: 20, basePrice: 100 },
    { name: 'Ecocardiografie', description: 'Ecografie cardiacă pentru evaluarea structurii și funcției inimii.', durationMin: 30, basePrice: 280 },
  ],
  Dermatologie: [
    { name: 'Dermatoscopie', description: 'Examinarea aluniţelor și leziunilor cu dermatoscop digital.', durationMin: 30, basePrice: 200 },
    { name: 'Crioterapie leziune cutanată', description: 'Tratarea verucilor și leziunilor benigne cu azot lichid.', durationMin: 20, basePrice: 180 },
  ],
  Endocrinologie: [
    { name: 'Evaluare profil hormonal', description: 'Interpretarea analizelor hormonale și recomandări de tratament.', durationMin: 30, basePrice: 220 },
  ],
  Gastroenterologie: [
    { name: 'Endoscopie digestivă superioară', description: 'Examinarea cu endoscop a esofagului, stomacului și duodenului.', durationMin: 60, basePrice: 600 },
  ],
  Ginecologie: [
    { name: 'Test Babeș-Papanicolaou', description: 'Screening pentru cancerul de col uterin.', durationMin: 20, basePrice: 150 },
    { name: 'Ecografie ginecologică', description: 'Examen ecografic al organelor pelvine.', durationMin: 25, basePrice: 200 },
  ],
  ORL: [
    { name: 'Otoscopie + audiometrie', description: 'Evaluarea urechilor și a auzului cu testare audiometrică.', durationMin: 25, basePrice: 180 },
  ],
  Neurologie: [
    { name: 'EEG (electroencefalogramă)', description: 'Înregistrarea activității electrice cerebrale.', durationMin: 45, basePrice: 350 },
  ],
  Oftalmologie: [
    { name: 'Examen fund de ochi', description: 'Evaluarea retinei și a nervului optic.', durationMin: 25, basePrice: 180 },
    { name: 'Măsurare presiune intraoculară', description: 'Screening pentru glaucom (tonometrie).', durationMin: 15, basePrice: 100 },
  ],
  Ortopedie: [
    { name: 'Infiltrație articulară', description: 'Injecție intra-articulară cu corticosteroizi sau acid hialuronic.', durationMin: 25, basePrice: 320 },
  ],
  Pediatrie: [
    { name: 'Vaccinare conform schemei', description: 'Administrarea vaccinurilor obligatorii sau opționale.', durationMin: 15, basePrice: 120 },
    { name: 'Evaluare dezvoltare neuropsihomotorie', description: 'Screening al etapelor de dezvoltare ale copilului.', durationMin: 30, basePrice: 180 },
  ],
  Pneumologie: [
    { name: 'Spirometrie', description: 'Evaluarea funcției respiratorii.', durationMin: 25, basePrice: 180 },
  ],
  Urologie: [
    { name: 'Ecografie renală și vezicală', description: 'Examen ecografic al aparatului urinar.', durationMin: 25, basePrice: 200 },
  ],
  Radiologie: [
    { name: 'Radiografie simplă', description: 'Imagistică standard pentru o regiune anatomică.', durationMin: 15, basePrice: 150 },
    { name: 'Ecografie generală', description: 'Examen ecografic complet al unei regiuni anatomice.', durationMin: 25, basePrice: 220 },
  ],
  'Chirurgie Generală': [
    { name: 'Consult preoperator', description: 'Evaluare în vederea unei intervenții chirurgicale.', durationMin: 30, basePrice: 350 },
  ],
  'Chirurgie Plastică': [
    { name: 'Consult estetic', description: 'Evaluare și plan personalizat pentru intervenții estetice.', durationMin: 45, basePrice: 400 },
  ],
  Reumatologie: [
    { name: 'Infiltrație periarticulară', description: 'Tratament local în afecțiuni reumatismale.', durationMin: 25, basePrice: 280 },
  ],
  Hematologie: [
    { name: 'Evaluare frotiu sanguin', description: 'Analiza microscopică a sângelui.', durationMin: 30, basePrice: 250 },
  ],
  Alergologie: [
    { name: 'Testare cutanată alergeni', description: 'Prick test pentru identificarea alergenilor.', durationMin: 45, basePrice: 280 },
  ],
};

// ─── Demo data for `doctor@synthea.ro` ──────────────────────────────
// A curated cardiology roster: real-feeling patients with histories,
// upcoming appointments, medical records, and reviews. Used to power
// a smooth demo on the legacy doctor account.

type DemoAppt = {
  daysFromNow: number; // negative = past, positive = future
  hour: number;
  minute: number;
  status: AppointmentStatus;
  reason?: string;
  duration?: number;
  record?: {
    diagnosis: string;
    symptoms?: string[];
    treatment?: string;
    prescription?: string;
    notes?: string;
  };
  review?: {
    rating: number;
    comment?: string;
  };
};

type DemoPatient = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ageYears: number;
  gender: 'MALE' | 'FEMALE';
  bloodType: string;
  allergies: string[];
  city: string;
  cnp?: string;
  insuranceNo?: string;
  emergencyContact?: string;
  appointments: DemoAppt[];
};

const DEMO_PATIENTS: DemoPatient[] = [
  {
    firstName: 'Maria', lastName: 'Popescu', email: 'demo.maria.popescu@synthea.ro', phone: '+40721000001',
    ageYears: 58, gender: 'FEMALE', bloodType: 'A+', allergies: ['Penicillin'], city: 'București',
    cnp: '2680312420019', insuranceNo: 'CNAS-001', emergencyContact: 'Andrei Popescu — +40721555001',
    appointments: [
      { daysFromNow: -180, hour: 10, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Control HTA',
        record: { diagnosis: 'Hipertensiune arterială esențială stadiul II', symptoms: ['cefalee', 'amețeli ocazionale'],
          treatment: 'Modificări de stil de viață + tratament antihipertensiv',
          prescription: 'Lisinopril 10mg, 1 cp/zi dimineața', notes: 'Recomandare reducere consum sare.' } },
      { daysFromNow: -90, hour: 14, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Reevaluare medicație',
        record: { diagnosis: 'HTA controlată sub tratament', symptoms: [],
          treatment: 'Continuare tratament curent', prescription: 'Lisinopril 10mg/zi + Aspenter 75mg/zi' } },
      { daysFromNow: -22, hour: 9, minute: 30, status: AppointmentStatus.COMPLETED, reason: 'Control trimestrial',
        record: { diagnosis: 'HTA bine controlată, TA medie 130/80', symptoms: [],
          notes: 'Pacientă stabilă, complianță bună.' },
        review: { rating: 5,
          comment: 'Doamna doctor este foarte atentă și răbdătoare. Mă simt în siguranță cu tratamentul recomandat.' } },
      { daysFromNow: 0, hour: 9, minute: 0, status: AppointmentStatus.CONFIRMED, reason: 'Control HTA programat azi' },
      { daysFromNow: 5, hour: 11, minute: 0, status: AppointmentStatus.CONFIRMED, reason: 'Control programat' },
    ],
  },
  {
    firstName: 'Ion', lastName: 'Constantin', email: 'demo.ion.constantin@synthea.ro', phone: '+40721000002',
    ageYears: 72, gender: 'MALE', bloodType: 'O+', allergies: [], city: 'Cluj-Napoca',
    cnp: '1530715120025', insuranceNo: 'CNAS-002', emergencyContact: 'Elena Constantin — +40721555002',
    appointments: [
      { daysFromNow: -155, hour: 10, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Control post-IMA',
        record: { diagnosis: 'Cardiopatie ischemică, post-IMA inferior 2024', symptoms: ['dispnee la efort'],
          treatment: 'Continuare DAPT, optimizare statină',
          prescription: 'Aspenter 75mg, Brilique 90mg x2/zi, Atorvastatină 40mg, Bisoprolol 5mg' } },
      { daysFromNow: -53, hour: 9, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Investigații cardiologice',
        record: { diagnosis: 'Boală coronariană stabilă', symptoms: ['palpitații rare'],
          treatment: 'Reducere doză Brilique conform protocolului DAPT 1 an',
          prescription: 'Aspenter 75mg, Brilique 60mg x2/zi, Atorvastatină 40mg, Bisoprolol 5mg',
          notes: 'EKG sinusal, FE prezervată (echo recent).' },
        review: { rating: 4, comment: 'Profesionist competent. Aș fi dorit ca timpul alocat consultației să fie ceva mai generos.' } },
      { daysFromNow: 0, hour: 10, minute: 30, status: AppointmentStatus.CONFIRMED, reason: 'Reevaluare medicație' },
      { daysFromNow: 2, hour: 14, minute: 30, status: AppointmentStatus.CONFIRMED, reason: 'Control periodic' },
    ],
  },
  {
    firstName: 'Elena', lastName: 'Vasilescu', email: 'demo.elena.vasilescu@synthea.ro', phone: '+40721000003',
    ageYears: 45, gender: 'FEMALE', bloodType: 'B+', allergies: ['Latex'], city: 'București',
    appointments: [
      { daysFromNow: -110, hour: 10, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Palpitații intermitente',
        record: { diagnosis: 'Aritmie sinusală benignă', symptoms: ['palpitații', 'anxietate'],
          treatment: 'Reducere consum cofeină, monitor Holter recomandat', notes: 'Holter 24h programat.' } },
      { daysFromNow: -28, hour: 11, minute: 30, status: AppointmentStatus.COMPLETED, reason: 'Rezultate Holter',
        record: { diagnosis: 'Extrasistole supraventriculare izolate, fără semnificație patologică', symptoms: [],
          treatment: 'Reasigurare, fără tratament necesar.', notes: 'Holter normal în limite.' },
        review: { rating: 5, comment: 'Mi-a explicat clar rezultatele și m-a liniștit. Foarte recomandat!' } },
      { daysFromNow: 7, hour: 9, minute: 0, status: AppointmentStatus.PENDING, reason: 'Reevaluare la 6 săptămâni' },
    ],
  },
  {
    firstName: 'Andrei', lastName: 'Marinescu', email: 'demo.andrei.marinescu@synthea.ro', phone: '+40721000004',
    ageYears: 62, gender: 'MALE', bloodType: 'AB+', allergies: ['Aspirin'], city: 'Iași',
    cnp: '1640228220018', emergencyContact: 'Diana Marinescu — +40721555004',
    appointments: [
      { daysFromNow: -143, hour: 9, minute: 30, status: AppointmentStatus.COMPLETED, reason: 'Fibrilație atrială',
        record: { diagnosis: 'Fibrilație atrială permanentă, CHA2DS2-VASc 3', symptoms: ['palpitații', 'oboseală'],
          treatment: 'Anticoagulare orală, control frecvență ventriculară',
          prescription: 'Eliquis 5mg x2/zi, Bisoprolol 5mg/zi' } },
      { daysFromNow: -75, hour: 10, minute: 30, status: AppointmentStatus.COMPLETED, reason: 'Control FA',
        record: { diagnosis: 'FA permanentă, frecvență controlată', symptoms: [],
          treatment: 'Continuare anticoagulant și beta-blocant', prescription: 'Eliquis 5mg x2/zi, Bisoprolol 5mg/zi' },
        review: { rating: 4, comment: 'Bun specialist. Cabinetul este curat și organizat.' } },
      { daysFromNow: -7, hour: 9, minute: 0, status: AppointmentStatus.NO_SHOW, reason: 'Control planificat' },
      { daysFromNow: 1, hour: 11, minute: 0, status: AppointmentStatus.CONFIRMED, reason: 'Reprogramare control' },
    ],
  },
  {
    firstName: 'Cristina', lastName: 'Stoica', email: 'demo.cristina.stoica@synthea.ro', phone: '+40721000005',
    ageYears: 38, gender: 'FEMALE', bloodType: 'A-', allergies: [], city: 'Brașov',
    appointments: [
      { daysFromNow: -17, hour: 10, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Evaluare cardiologică anuală',
        record: { diagnosis: 'Status cardiologic normal', symptoms: [],
          treatment: 'Activitate fizică regulată, dietă echilibrată', notes: 'EKG normal, fără patologie.' },
        review: { rating: 5, comment: 'O experiență foarte plăcută. Am primit recomandări utile pentru menținerea sănătății.' } },
      { daysFromNow: 0, hour: 12, minute: 0, status: AppointmentStatus.PENDING, reason: 'Consultație de rutină' },
    ],
  },
  {
    firstName: 'Mihai', lastName: 'Dumitrescu', email: 'demo.mihai.dumitrescu@synthea.ro', phone: '+40721000006',
    ageYears: 67, gender: 'MALE', bloodType: 'O-', allergies: ['Sulfa drugs'], city: 'Timișoara',
    cnp: '1590418350023', emergencyContact: 'Vasile Dumitrescu — +40721555006',
    appointments: [
      { daysFromNow: -210, hour: 9, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Insuficiență cardiacă',
        record: { diagnosis: 'Insuficiență cardiacă cronică NYHA II, FE 40%', symptoms: ['dispnee', 'edeme periferice'],
          treatment: 'Tripla terapie HF', prescription: 'Furosemid 40mg, Carvedilol 12.5mg x2/zi, Spironolactonă 25mg, Entresto 49/51 x2/zi' } },
      { daysFromNow: -113, hour: 10, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Reevaluare HF',
        record: { diagnosis: 'IC cronică stabilă, simptome ameliorate', symptoms: ['dispnee minimă'],
          treatment: 'Continuare', notes: 'Echo: FE 45%, în îmbunătățire.' } },
      { daysFromNow: -48, hour: 9, minute: 30, status: AppointmentStatus.COMPLETED, reason: 'Control trimestrial',
        record: { diagnosis: 'IC cronică, status stabil', symptoms: [],
          treatment: 'Continuare schemă',
          prescription: 'Furosemid 40mg, Carvedilol 12.5mg x2/zi, Spironolactonă 25mg, Entresto 49/51 x2/zi' },
        review: { rating: 3, comment: 'Tratament eficient, dar așteptarea la programare a fost destul de mare.' } },
      { daysFromNow: 5, hour: 14, minute: 0, status: AppointmentStatus.CONFIRMED, reason: 'Control trimestrial' },
    ],
  },
  {
    firstName: 'Adriana', lastName: 'Florescu', email: 'demo.adriana.florescu@synthea.ro', phone: '+40721000007',
    ageYears: 52, gender: 'FEMALE', bloodType: 'B-', allergies: ['Penicillin', 'Pollen'], city: 'București',
    cnp: '2740508410017',
    appointments: [
      { daysFromNow: -86, hour: 10, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'HTA + DZ tip 2',
        record: { diagnosis: 'HTA stadiul I + Diabet zaharat tip 2', symptoms: ['cefalee'],
          treatment: 'Tratament antihipertensiv + monitorizare glicemie', prescription: 'Tritace 5mg/zi, Metformin 1000mg x2/zi' } },
      { daysFromNow: -15, hour: 11, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Reevaluare',
        record: { diagnosis: 'HTA și DZ controlate, profil lipidic ușor crescut', symptoms: [],
          treatment: 'Adaos statină',
          prescription: 'Tritace 5mg/zi, Metformin 1000mg x2/zi, Atorvastatină 20mg/zi' },
        review: { rating: 5, comment: 'Atenție la detalii și o abordare integrată a problemelor de sănătate. Mulțumesc!' } },
      { daysFromNow: 6, hour: 10, minute: 30, status: AppointmentStatus.PENDING, reason: 'Control programat' },
    ],
  },
  {
    firstName: 'Vlad', lastName: 'Niculescu', email: 'demo.vlad.niculescu@synthea.ro', phone: '+40721000008',
    ageYears: 71, gender: 'MALE', bloodType: 'A+', allergies: [], city: 'Constanța',
    cnp: '1551105140037', emergencyContact: 'Sorin Niculescu — +40721555008',
    appointments: [
      { daysFromNow: -163, hour: 9, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Control post-stent LAD',
        record: { diagnosis: 'Cardiopatie ischemică post-stent LAD (2024)', symptoms: [],
          treatment: 'DAPT 12 luni, statină intensivă',
          prescription: 'Aspenter 75mg/zi, Plavix 75mg/zi, Atorvastatină 80mg/zi' } },
      { daysFromNow: -63, hour: 10, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Reevaluare la 1 an post-stent',
        record: { diagnosis: 'Status post-PCI stabil, fără simptome anginoase', symptoms: [],
          treatment: 'Trecere la monoterapie antiagregantă',
          prescription: 'Aspenter 75mg/zi, Atorvastatină 80mg/zi' },
        review: { rating: 4, comment: 'Foarte bun cardiolog. Mi-a explicat clar tranziția la monoterapie.' } },
      { daysFromNow: 0, hour: 15, minute: 30, status: AppointmentStatus.CONFIRMED, reason: 'Control post-stent' },
      { daysFromNow: 8, hour: 9, minute: 30, status: AppointmentStatus.CONFIRMED, reason: 'Control de rutină' },
    ],
  },
  {
    firstName: 'Gabriela', lastName: 'Munteanu', email: 'demo.gabriela.munteanu@synthea.ro', phone: '+40721000009',
    ageYears: 49, gender: 'FEMALE', bloodType: 'O+', allergies: [], city: 'Sibiu',
    appointments: [
      { daysFromNow: -12, hour: 11, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Palpitații în investigare',
        record: { diagnosis: 'Tahicardie sinusală în context de anxietate', symptoms: ['palpitații', 'tremurături'],
          treatment: 'Reducere cofeină + tehnici de relaxare; monitor Holter dacă persistă', notes: 'Recomandare consult psihologic.' } },
      { daysFromNow: 0, hour: 14, minute: 0, status: AppointmentStatus.CONFIRMED, reason: 'Reevaluare palpitații' },
      { daysFromNow: 2, hour: 10, minute: 0, status: AppointmentStatus.PENDING, reason: 'Reevaluare după 2 săptămâni' },
    ],
  },
  {
    firstName: 'Ștefan', lastName: 'Pop', email: 'demo.stefan.pop@synthea.ro', phone: '+40721000010',
    ageYears: 65, gender: 'MALE', bloodType: 'AB-', allergies: ['Ibuprofen'], city: 'Oradea',
    cnp: '1610821300012',
    appointments: [
      { daysFromNow: -56, hour: 10, minute: 0, status: AppointmentStatus.COMPLETED, reason: 'Hipercolesterolemie',
        record: { diagnosis: 'Dislipidemie mixtă, risc cardiovascular crescut', symptoms: [],
          treatment: 'Statină + dietă',
          prescription: 'Atorvastatină 40mg/zi' } },
      { daysFromNow: -19, hour: 9, minute: 0, status: AppointmentStatus.CANCELLED, reason: 'Reevaluare lipide' },
      { daysFromNow: -6, hour: 9, minute: 30, status: AppointmentStatus.COMPLETED, reason: 'Reevaluare lipide (reprogramat)',
        record: { diagnosis: 'Profil lipidic în ameliorare, LDL 95mg/dl', symptoms: [],
          treatment: 'Continuare', prescription: 'Atorvastatină 40mg/zi' },
        review: { rating: 5, comment: 'Profesionist serios și empatic, recomand cu încredere!' } },
      { daysFromNow: 13, hour: 9, minute: 30, status: AppointmentStatus.CONFIRMED, reason: 'Control lipide la 3 luni' },
    ],
  },
];

// Per-doctor rating profile — different doctors have different reputations,
// so booking results show realistic variety (some 4.7-stars, some 3.3-stars).
const RATING_POOLS: number[][] = [
  [5, 5, 5, 5, 4, 4, 4, 4, 5, 4, 5, 5], // "great"  — avg ~4.6
  [5, 4, 4, 4, 4, 5, 4, 3, 5, 4, 4, 5], // "very good" — avg ~4.3
  [5, 4, 4, 3, 4, 4, 5, 3, 4, 4, 3, 4], // "good"   — avg ~3.9
  [4, 3, 4, 3, 3, 4, 5, 3, 4, 2, 4, 3], // "mixed"  — avg ~3.5
  [3, 3, 4, 2, 3, 4, 3, 2, 4, 3, 3, 5], // "uneven" — avg ~3.2
];
const POOL_DISTRIBUTION = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4]; // 36% great, 27% very good, 18% good, 9% mixed, 9% uneven

// ─── Helpers ─────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function pseudoIndex(seed: string, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}

// ─── Main ────────────────────────────────────────────────────────────

async function seedDemoForLegacyDoctor(patientPasswordHash: string) {
  const doctor = await prisma.user.findUnique({
    where: { email: 'doctor@synthea.ro' },
    include: { doctorProfile: true },
  });
  if (!doctor || !doctor.doctorProfile) {
    console.log('  Skipping demo seed: doctor@synthea.ro or DoctorProfile not found.');
    return;
  }

  // The demo runs in two cumulative phases so we can re-run after adding a new
  // step (e.g. invoices) without duplicating the existing data:
  //   Phase A — users / appointments / records / reviews (skipped if any demo.* user exists)
  //   Phase B — invoices for completed demo appointments (skipped if any already exist)

  const demoUsersExist = (await prisma.user.count({ where: { email: { startsWith: 'demo.' } } })) > 0;
  const demoInvoicesExist =
    (await prisma.invoice.count({
      where: { patient: { user: { email: { startsWith: 'demo.' } } } },
    })) > 0;

  if (demoUsersExist && demoInvoicesExist) {
    console.log('  Demo data + invoices for doctor@synthea.ro already present — skipping.');
    return;
  }

  const skipPhaseA = demoUsersExist;
  const skipPhaseB = demoInvoicesExist;

  if (!skipPhaseA) {
    // Wipe ghost bookings on the legacy doctor so the demo schedule is clean.
    await prisma.appointment.deleteMany({
      where: {
        doctorId: doctor.id,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        reason: 'Programare existentă',
      },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const consultFee = doctor.doctorProfile.consultationFee;

  let createdAppts = 0;
  let createdRecords = 0;
  let createdReviews = 0;
  let createdInvoices = 0;

  // Optional add-on services per appointment (deterministic by reason hash) so
  // invoices look realistic with multiple line items rather than just "consult".
  const ADDON_POOL: { description: string; unitPrice: number; weight: number }[] = [
    { description: 'EKG (electrocardiogramă)', unitPrice: 80, weight: 5 },
    { description: 'Ecocardiografie', unitPrice: 250, weight: 3 },
    { description: 'Holter EKG 24h', unitPrice: 200, weight: 2 },
    { description: 'Test de efort', unitPrice: 220, weight: 2 },
    { description: 'Investigații paraclinice', unitPrice: 120, weight: 4 },
    { description: 'Consultanță telemedicină follow-up', unitPrice: 60, weight: 2 },
  ];
  const flatPool: { description: string; unitPrice: number }[] = [];
  for (const a of ADDON_POOL) for (let i = 0; i < a.weight; i++) flatPool.push(a);

  // ─── Phase A: users / appointments / records / reviews ───────────────
  if (!skipPhaseA) for (const [dpIdx, dp] of DEMO_PATIENTS.entries()) {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - dp.ageYears);
    dob.setMonth((dp.ageYears * 7) % 12);
    dob.setDate(1 + ((dp.ageYears * 11) % 27));

    const user = await prisma.user.upsert({
      where: { email: dp.email },
      update: {},
      create: {
        email: dp.email,
        passwordHash: patientPasswordHash,
        role: Role.PATIENT,
        firstName: dp.firstName,
        lastName: dp.lastName,
        phone: dp.phone,
      },
    });

    let pp = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
    if (!pp) {
      pp = await prisma.patientProfile.create({
        data: {
          userId: user.id,
          dateOfBirth: dob,
          gender: dp.gender as Gender,
          bloodType: dp.bloodType,
          allergies: dp.allergies,
          cnp: generateCNP(dp.gender as Gender, dob, dp.city),
          insuranceNo: dp.insuranceNo ?? generateInsuranceNo(dp.city, dpIdx),
          emergencyContact: dp.emergencyContact ?? generateEmergencyContact(dpIdx),
          address: generateAddress(dpIdx),
          city: dp.city,
          country: 'Romania',
        },
      });
    }

    // Demo triage statuses on a deterministic subset (most patients stay untriaged).
    const triagePick = ['CRITICAL', null, 'INTERMEDIATE', null, 'GOOD', null] as const;
    const desiredTriage = triagePick[dp.ageYears % triagePick.length];
    if (desiredTriage && pp.triageStatus === null) {
      await prisma.patientProfile.update({
        where: { id: pp.id },
        data: { triageStatus: desiredTriage, triagedAt: new Date(), triagedById: doctor.id },
      });
    }

    for (const a of dp.appointments) {
      const scheduledAt = new Date(today);
      scheduledAt.setDate(scheduledAt.getDate() + a.daysFromNow);
      scheduledAt.setHours(a.hour, a.minute, 0, 0);

      const appt = await prisma.appointment.create({
        data: {
          doctorId: doctor.id,
          patientId: pp.id,
          scheduledAt,
          duration: a.duration ?? 30,
          status: a.status,
          reason: a.reason,
          feeAtBooking: consultFee,
        },
      });
      createdAppts++;

      if (a.record && a.status === AppointmentStatus.COMPLETED) {
        await prisma.medicalRecord.create({
          data: {
            patientId: pp.id,
            doctorId: doctor.id,
            appointmentId: appt.id,
            diagnosis: a.record.diagnosis,
            symptoms: a.record.symptoms ?? [],
            treatment: a.record.treatment,
            prescription: a.record.prescription,
            notes: a.record.notes,
          },
        });
        createdRecords++;
      }

      if (a.review && a.status === AppointmentStatus.COMPLETED) {
        await prisma.review.create({
          data: {
            patientId: pp.id,
            doctorId: doctor.doctorProfile.id,
            appointmentId: appt.id,
            rating: a.review.rating,
            comment: a.review.comment,
          },
        });
        createdReviews++;
      }
    }
  }

  // ─── Phase B: invoices for every demo COMPLETED appointment ─────────
  if (!skipPhaseB) {
    const completedDemoAppts = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: AppointmentStatus.COMPLETED,
        patient: { user: { email: { startsWith: 'demo.' } } },
      },
      select: { id: true, patientId: true, scheduledAt: true, reason: true, feeAtBooking: true },
    });

    for (const appt of completedDemoAppts) {
      // Status follows the age of the appointment so totals look realistic:
      //   ≥ 60 days old: PAID
      //   7-60 days old: mostly PAID, ~20% OVERDUE/ISSUED for variety
      //   < 7 days old:  ISSUED (still within payment window)
      const baseFee = appt.feeAtBooking ?? consultFee;
      const baseLineItem = {
        description: `Consultație ${doctor.doctorProfile.specialty.toLowerCase()}`,
        quantity: 1,
        unitPrice: baseFee,
      };
      const addonSeed = pseudoIndex(appt.id, 1000);
      const numAddons = addonSeed % 3; // 0, 1 or 2
      const lineItems: { description: string; quantity: number; unitPrice: number }[] = [baseLineItem];
      const usedAddons = new Set<string>();
      for (let i = 0; i < numAddons; i++) {
        const pick = flatPool[(addonSeed + i * 7) % flatPool.length];
        if (usedAddons.has(pick.description)) continue;
        usedAddons.add(pick.description);
        lineItems.push({ description: pick.description, quantity: 1, unitPrice: pick.unitPrice });
      }
      const amount = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

      const ageMs = today.getTime() - appt.scheduledAt.getTime();
      const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
      let status: InvoiceStatus;
      let paidAt: Date | null = null;
      let stripePaymentId: string | null = null;
      if (ageDays >= 60) {
        status = InvoiceStatus.PAID;
      } else if (ageDays >= 7) {
        if (addonSeed % 10 < 7) status = InvoiceStatus.PAID;
        else if (addonSeed % 10 < 9) status = InvoiceStatus.OVERDUE;
        else status = InvoiceStatus.ISSUED;
      } else {
        status = InvoiceStatus.ISSUED;
      }
      if (status === InvoiceStatus.PAID) {
        paidAt = new Date(appt.scheduledAt);
        paidAt.setDate(paidAt.getDate() + (1 + (addonSeed % 7)));
        stripePaymentId = `pi_demo_${addonSeed}`;
      }

      const dueDate = new Date(appt.scheduledAt);
      dueDate.setDate(dueDate.getDate() + 30);

      await prisma.invoice.create({
        data: {
          patientId: appt.patientId,
          amount,
          currency: doctor.doctorProfile.currency,
          status,
          lineItems: lineItems as unknown as Prisma.InputJsonValue,
          dueDate,
          paidAt,
          stripePaymentId,
          notes: appt.reason ? `Pentru: ${appt.reason}` : undefined,
          createdAt: appt.scheduledAt,
          updatedAt: paidAt ?? appt.scheduledAt,
        },
      });
      createdInvoices++;
    }
  }

  if (!skipPhaseA) {
    // Recompute the legacy doctor's avg rating to include the new demo reviews.
    const stats = await prisma.review.aggregate({
      where: { doctorId: doctor.doctorProfile.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    if (stats._count.rating > 0) {
      await prisma.doctorProfile.update({
        where: { id: doctor.doctorProfile.id },
        data: {
          avgRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
          totalReviews: stats._count.rating,
        },
      });
    }
  }

  console.log(
    `  Demo for doctor@synthea.ro: ${DEMO_PATIENTS.length} patients, ${createdAppts} appointments, ${createdRecords} medical records, ${createdReviews} reviews, ${createdInvoices} invoices.`
  );
}

async function main() {
  console.log('Seeding database...');

  const adminHash = await bcrypt.hash(PWD_ADMIN, 12);
  const docHash = await bcrypt.hash(PWD_DOCTOR, 12);
  const patHash = await bcrypt.hash(PWD_PATIENT, 12);
  const nurseHash = await bcrypt.hash(PWD_NURSE, 12);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@synthea.ro' },
    update: {},
    create: {
      email: 'admin@synthea.ro',
      passwordHash: adminHash,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'Synthea',
      phone: '+40700000000',
    },
  });

  // Legacy doctor — preserves the doctor@synthea.ro test login
  const legacyDoc = await prisma.user.upsert({
    where: { email: 'doctor@synthea.ro' },
    update: {},
    create: {
      email: 'doctor@synthea.ro',
      passwordHash: docHash,
      role: Role.DOCTOR,
      firstName: 'Ion',
      lastName: 'Popescu',
      phone: '+40711111111',
    },
  });
  const legacyDocProfile = await prisma.doctorProfile.findUnique({ where: { userId: legacyDoc.id } });
  if (!legacyDocProfile) {
    await prisma.doctorProfile.create({
      data: {
        userId: legacyDoc.id,
        specialty: 'Cardiologie',
        bio: 'Cardiolog cu peste 15 ani de experiență.',
        yearsOfExperience: 15,
        consultationFee: 250,
        currency: 'RON',
        languages: ['RO', 'EN'],
        clinicAddress: 'Str. Medicinei 5, București',
        acceptsNewPatients: true,
      },
    });
  }

  // Doctors per specialty
  let docCounter = 0;
  for (const spec of SPECIALTIES) {
    for (let i = 0; i < spec.count; i++) {
      const idx = docCounter++;
      const isMale = idx % 2 === 0;
      const first = isMale ? FIRST_M[idx % FIRST_M.length] : FIRST_F[idx % FIRST_F.length];
      const last = LAST[(idx * 3 + spec.name.length) % LAST.length];
      const slug = `${slugify(first)}.${slugify(last)}.${idx}`;
      const email = `dr.${slug}@synthea.ro`;

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: docHash,
          role: Role.DOCTOR,
          firstName: first,
          lastName: last,
          phone: `+407${String(20000000 + idx).padStart(8, '0')}`,
        },
      });

      const exists = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (!exists) {
        const fee = spec.baseFee + i * 25;
        const yearsExp = 4 + ((idx * 13) % 28); // 4..31
        await prisma.doctorProfile.create({
          data: {
            userId: user.id,
            specialty: spec.name,
            bio: spec.bio,
            yearsOfExperience: yearsExp,
            consultationFee: fee,
            currency: 'RON',
            languages: idx % 3 === 0 ? ['RO', 'EN', 'FR'] : ['RO', 'EN'],
            clinicAddress: `Str. Sănătății ${10 + idx}, București`,
            acceptsNewPatients: idx % 7 !== 0, // ~85% accept
          },
        });
      }
    }
  }

  // ─── Medical services per specialty (≥ 5 each) ──────────────────────
  for (const spec of SPECIALTIES) {
    const services: ServiceSpec[] = [
      ...universalServices(spec.baseFee),
      ...(SPECIALTY_EXTRAS[spec.name] ?? []),
    ];
    for (const svc of services) {
      const existing = await prisma.medicalService.findFirst({
        where: { specialty: spec.name, name: svc.name },
      });
      if (existing) continue;
      await prisma.medicalService.create({
        data: {
          specialty: spec.name,
          name: svc.name,
          description: svc.description,
          durationMin: svc.durationMin,
          basePrice: svc.basePrice,
          active: true,
        },
      });
    }
  }

  // Legacy patient
  const legacyPatient = await prisma.user.upsert({
    where: { email: 'patient@synthea.ro' },
    update: {},
    create: {
      email: 'patient@synthea.ro',
      passwordHash: patHash,
      role: Role.PATIENT,
      firstName: 'Maria',
      lastName: 'Ionescu',
      phone: '+40722222222',
    },
  });
  const legacyPatProfile = await prisma.patientProfile.findUnique({ where: { userId: legacyPatient.id } });
  if (!legacyPatProfile) {
    await prisma.patientProfile.create({
      data: {
        userId: legacyPatient.id,
        dateOfBirth: new Date('1985-06-15'),
        gender: Gender.FEMALE,
        bloodType: 'A+',
        allergies: ['Penicillin'],
        cnp: generateCNP(Gender.FEMALE, new Date('1985-06-15'), 'București'),
        insuranceNo: generateInsuranceNo('București', 7),
        emergencyContact: generateEmergencyContact(7),
        address: generateAddress(7),
        city: 'București',
        country: 'Romania',
      },
    });
  }

  // Additional patients with varied ages, allergies, and fully-populated records.
  const EXTRA_PATIENT_COUNT = 200;
  for (let i = 0; i < EXTRA_PATIENT_COUNT; i++) {
    const isMale = i % 2 === 0;
    const first = isMale ? FIRST_M[(i * 5) % FIRST_M.length] : FIRST_F[(i * 5) % FIRST_F.length];
    const last = LAST[(i * 7) % LAST.length];
    const slug = `${slugify(first)}.${slugify(last)}.${i}`;
    const email = `pacient.${slug}@synthea.ro`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: patHash,
        role: Role.PATIENT,
        firstName: first,
        lastName: last,
        phone: `+407${String(30000000 + i).padStart(8, '0')}`,
      },
    });

    const exists = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
    if (!exists) {
      // Vary age 5..85
      const age = 5 + ((i * 17) % 80);
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - age);
      dob.setMonth((i * 7) % 12);
      dob.setDate(1 + ((i * 11) % 27));

      const numAllergies = i % 4; // 0..3
      const allergies: string[] = [];
      for (let j = 0; j < numAllergies; j++) {
        const a = ALLERGIES[(i + j * 3) % ALLERGIES.length];
        if (!allergies.includes(a)) allergies.push(a);
      }

      const gender = isMale ? Gender.MALE : Gender.FEMALE;
      const city = CITIES[i % CITIES.length];

      await prisma.patientProfile.create({
        data: {
          userId: user.id,
          dateOfBirth: dob,
          gender,
          bloodType: BLOOD[i % BLOOD.length],
          allergies,
          cnp: generateCNP(gender, dob, city),
          insuranceNo: generateInsuranceNo(city, i),
          emergencyContact: generateEmergencyContact(i),
          address: generateAddress(i),
          city,
          country: 'Romania',
        },
      });
    }
  }

  // 10 nurses
  for (let i = 0; i < 10; i++) {
    const isMale = i % 4 === 0;
    const first = isMale ? FIRST_M[(i + 3) % FIRST_M.length] : FIRST_F[(i + 4) % FIRST_F.length];
    const last = LAST[(i + 7) % LAST.length];
    const slug = `${slugify(first)}.${slugify(last)}.${i}`;
    const email = `asistent.${slug}@synthea.ro`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: nurseHash,
        role: Role.NURSE,
        firstName: first,
        lastName: last,
        phone: `+407${String(40000000 + i).padStart(8, '0')}`,
      },
    });
  }

  // Sample completed appointments + reviews to populate ratings.
  // Idempotent: skip a doctor if their profile already has reviews.
  const allPatients = await prisma.patientProfile.findMany({ select: { id: true } });
  const allDoctors = await prisma.user.findMany({
    where: { role: Role.DOCTOR },
    include: { doctorProfile: true },
  });

  const REASONS = [
    'Consultație de rutină',
    'Control periodic',
    'Investigații suplimentare',
    'Reevaluare tratament',
    'Simptome persistente',
    'Consultație de urmărire',
    'Prima consultație',
  ];

  for (const doctor of allDoctors) {
    if (!doctor.doctorProfile) continue;
    if (doctor.doctorProfile.totalReviews > 0) continue;
    if (allPatients.length === 0) continue;

    // Each doctor draws from one of the rating pools (so doctors have realistic, distinct reputations).
    const poolIdx = POOL_DISTRIBUTION[pseudoIndex(doctor.email, POOL_DISTRIBUTION.length)];
    const ratingPool = RATING_POOLS[poolIdx];

    const numReviews = pseudoIndex(doctor.email + 'r', 14) + 2; // 2..15 reviews per doctor
    const ratings: number[] = [];

    for (let i = 0; i < numReviews; i++) {
      const patient = allPatients[pseudoIndex(doctor.email + i, allPatients.length)];
      if (!patient) continue;

      const past = new Date();
      past.setDate(past.getDate() - (i * 5 + 2));
      past.setHours(9 + (i % 8), (i % 2) * 30, 0, 0);

      const existingAppt = await prisma.appointment.findFirst({
        where: { doctorId: doctor.id, patientId: patient.id, scheduledAt: past },
      });
      if (existingAppt) continue;

      const appt = await prisma.appointment.create({
        data: {
          doctorId: doctor.id,
          patientId: patient.id,
          scheduledAt: past,
          duration: 30,
          status: AppointmentStatus.COMPLETED,
          reason: REASONS[(i + pseudoIndex(doctor.email, REASONS.length)) % REASONS.length],
          feeAtBooking: doctor.doctorProfile.consultationFee,
        },
      });

      const rating = ratingPool[(i + pseudoIndex(doctor.email + 'p', ratingPool.length)) % ratingPool.length];

      // Pick a comment that matches the rating sentiment.
      let comment: string | null;
      if (rating >= 5) {
        comment = REVIEW_COMMENTS_POSITIVE[(i * 3) % REVIEW_COMMENTS_POSITIVE.length];
      } else if (rating === 4) {
        comment = i % 3 === 0
          ? REVIEW_COMMENTS_NEUTRAL[(i * 2) % REVIEW_COMMENTS_NEUTRAL.length]
          : REVIEW_COMMENTS_POSITIVE[(i * 5 + 1) % REVIEW_COMMENTS_POSITIVE.length];
      } else if (rating === 3) {
        comment = REVIEW_COMMENTS_NEUTRAL[(i * 2 + 1) % REVIEW_COMMENTS_NEUTRAL.length];
      } else {
        comment = REVIEW_COMMENTS_NEGATIVE[i % REVIEW_COMMENTS_NEGATIVE.length];
      }

      try {
        await prisma.review.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.doctorProfile.id,
            appointmentId: appt.id,
            rating,
            comment,
          },
        });
        ratings.push(rating);
      } catch {
        // unique constraint or other — skip
      }
    }

    if (ratings.length > 0) {
      const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
      await prisma.doctorProfile.update({
        where: { id: doctor.doctorProfile.id },
        data: {
          avgRating: Math.round(avg * 10) / 10,
          totalReviews: ratings.length,
        },
      });
    }
  }

  // ─── Ghost bookings on future weekdays ──────────────────────────────
  // Each (doctor, future weekday) gets a deterministic but distinct subset
  // of slots already booked. All ghost bookings are owned by a single
  // SYSTEM patient (not used for login) so real demo patients see a clean
  // appointment list while the booking flow still sees varied availability.

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const SLOTS_PER_DAY: number[] = []; // minutes from midnight: 480, 510, …, 1050
  for (let h = 8; h < 18; h++) {
    SLOTS_PER_DAY.push(h * 60, h * 60 + 30);
  }

  // Create or reuse the system patient that owns ghost bookings.
  const SYSTEM_PATIENT_EMAIL = '_ghosts@synthea.ro';
  const systemPatientUser = await prisma.user.upsert({
    where: { email: SYSTEM_PATIENT_EMAIL },
    update: {},
    create: {
      email: SYSTEM_PATIENT_EMAIL,
      passwordHash: patHash, // never used to log in, but column is required
      role: Role.PATIENT,
      firstName: '_',
      lastName: 'System',
      isActive: false, // disabled — cannot be used to authenticate
    },
  });
  let systemPatientProfile = await prisma.patientProfile.findUnique({
    where: { userId: systemPatientUser.id },
  });
  if (!systemPatientProfile) {
    systemPatientProfile = await prisma.patientProfile.create({
      data: {
        userId: systemPatientUser.id,
        dateOfBirth: new Date('1990-01-01'),
        gender: Gender.OTHER,
        country: 'Romania',
      },
    });
  }
  const SYSTEM_PATIENT_ID = systemPatientProfile.id;

  const ghostBookings: Prisma.AppointmentCreateManyInput[] = [];
  let doctorsWithGhosts = 0;

  for (const doctor of allDoctors) {
    if (!doctor.doctorProfile) continue;
    // The legacy doctor is reserved for the curated demo data — keep their schedule clean.
    if (doctor.email === 'doctor@synthea.ro') continue;

    const futureCount = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        scheduledAt: { gte: today },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        patientId: SYSTEM_PATIENT_ID,
      },
    });
    if (futureCount > 0) continue; // already seeded — skip

    doctorsWithGhosts++;

    for (let offset = 1; offset <= 45; offset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends

      const dateKey = date.toISOString().slice(0, 10);
      const seed = pseudoIndex(doctor.email + dateKey, 100000);

      // ~25% chance the doctor has no bookings that day (so some days are wide open)
      if (seed % 100 < 25) continue;

      // 3..8 ghost bookings per day, deterministic
      const numBookings = 3 + (seed % 6);

      // Linear-congruential walk through SLOTS_PER_DAY to pick distinct slots
      const picked = new Set<number>();
      let walker = seed | 1;
      while (picked.size < numBookings && picked.size < SLOTS_PER_DAY.length) {
        walker = ((walker * 1103515245 + 12345) >>> 0) % 2147483647;
        picked.add(SLOTS_PER_DAY[walker % SLOTS_PER_DAY.length]);
      }

      for (const minutes of picked) {
        const scheduledAt = new Date(date);
        scheduledAt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
        ghostBookings.push({
          doctorId: doctor.id,
          patientId: SYSTEM_PATIENT_ID,
          scheduledAt,
          duration: 30,
          status: minutes % 60 === 0 ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING,
          reason: 'Programare existentă',
          feeAtBooking: doctor.doctorProfile.consultationFee,
        });
      }
    }
  }

  if (ghostBookings.length > 0) {
    for (let i = 0; i < ghostBookings.length; i += 1000) {
      await prisma.appointment.createMany({
        data: ghostBookings.slice(i, i + 1000),
        skipDuplicates: true,
      });
    }
    console.log(`  Inserted ${ghostBookings.length} ghost bookings across ${doctorsWithGhosts} doctors.`);
  }

  // ─── Demo data tied to doctor@synthea.ro ────────────────────────────
  await seedDemoForLegacyDoctor(patHash);

  // Summary
  const counts = {
    admins: await prisma.user.count({ where: { role: Role.ADMIN } }),
    doctors: await prisma.user.count({ where: { role: Role.DOCTOR } }),
    patients: await prisma.user.count({ where: { role: Role.PATIENT } }),
    nurses: await prisma.user.count({ where: { role: Role.NURSE } }),
    reviews: await prisma.review.count(),
    services: await prisma.medicalService.count(),
    futureAppointments: await prisma.appointment.count({
      where: {
        scheduledAt: { gte: today },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
    }),
  };

  console.log('Seed completed.');
  console.log(`  Admins:   ${counts.admins}`);
  console.log(`  Doctors:  ${counts.doctors}`);
  console.log(`  Patients: ${counts.patients}`);
  console.log(`  Nurses:   ${counts.nurses}`);
  console.log(`  Reviews:  ${counts.reviews}`);
  console.log(`  Services: ${counts.services}`);
  console.log(`  Future appointments: ${counts.futureAppointments}`);
  console.log('');
  console.log('Demo logins:');
  console.log(`  Admin    admin@synthea.ro      / ${PWD_ADMIN}`);
  console.log(`  Doctor   doctor@synthea.ro     / ${PWD_DOCTOR}`);
  console.log(`  Patient  patient@synthea.ro    / ${PWD_PATIENT}`);
  console.log(`  All seeded doctors  use: ${PWD_DOCTOR}`);
  console.log(`  All seeded patients use: ${PWD_PATIENT}`);
  console.log(`  All seeded nurses   use: ${PWD_NURSE}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
