import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed admin user
  const adminHash = await bcrypt.hash('Admin@1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@synthea.ro' },
    update: {},
    create: {
      email: 'admin@synthea.ro',
      passwordHash: adminHash,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Synthea',
      phone: '+40700000000',
    },
  });

  // Seed doctor user
  const doctorHash = await bcrypt.hash('Doctor@1234!', 12);
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@synthea.ro' },
    update: {},
    create: {
      email: 'doctor@synthea.ro',
      passwordHash: doctorHash,
      role: 'DOCTOR',
      firstName: 'Ion',
      lastName: 'Popescu',
      phone: '+40711111111',
    },
  });

  // Seed patient user
  const patientHash = await bcrypt.hash('Patient@1234!', 12);
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@synthea.ro' },
    update: {},
    create: {
      email: 'patient@synthea.ro',
      passwordHash: patientHash,
      role: 'PATIENT',
      firstName: 'Maria',
      lastName: 'Ionescu',
      phone: '+40722222222',
    },
  });

  // Seed patient profile
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      dateOfBirth: new Date('1985-06-15'),
      gender: 'FEMALE',
      address: 'Str. Florilor 10',
      city: 'București',
      bloodType: 'A+',
      allergies: ['Penicillin'],
    },
  });

  console.log('✅ Seed completed!');
  console.log(`   Admin: admin@synthea.ro / Admin@1234!`);
  console.log(`   Doctor: doctor@synthea.ro / Doctor@1234!`);
  console.log(`   Patient: patient@synthea.ro / Patient@1234!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
