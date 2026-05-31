export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  status: 'stable' | 'critical' | 'recovering';
  lastVisit: string;
  nextAppointment?: string;
  phone: string;
  email: string;
  bloodType: string;
  allergies: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  doctor: string;
}

export interface Invoice {
  id: string;
  patientName: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  services: string[];
}

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 34,
    gender: 'Female',
    condition: 'Hypertension',
    status: 'stable',
    lastVisit: '2026-03-15',
    nextAppointment: '2026-04-10',
    phone: '(555) 123-4567',
    email: 'sarah.j@email.com',
    bloodType: 'A+',
    allergies: ['Penicillin'],
  },
  {
    id: '2',
    name: 'Michael Chen',
    age: 45,
    gender: 'Male',
    condition: 'Type 2 Diabetes',
    status: 'recovering',
    lastVisit: '2026-04-02',
    nextAppointment: '2026-04-08',
    phone: '(555) 234-5678',
    email: 'mchen@email.com',
    bloodType: 'O-',
    allergies: [],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    age: 28,
    gender: 'Female',
    condition: 'Asthma',
    status: 'stable',
    lastVisit: '2026-03-20',
    nextAppointment: '2026-04-15',
    phone: '(555) 345-6789',
    email: 'emily.r@email.com',
    bloodType: 'B+',
    allergies: ['Sulfa drugs'],
  },
  {
    id: '4',
    name: 'David Thompson',
    age: 52,
    gender: 'Male',
    condition: 'Post-surgery Recovery',
    status: 'recovering',
    lastVisit: '2026-04-05',
    nextAppointment: '2026-04-09',
    phone: '(555) 456-7890',
    email: 'dthompson@email.com',
    bloodType: 'AB+',
    allergies: ['Latex'],
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    age: 41,
    gender: 'Female',
    condition: 'Migraine',
    status: 'stable',
    lastVisit: '2026-03-28',
    nextAppointment: '2026-04-12',
    phone: '(555) 567-8901',
    email: 'lisa.a@email.com',
    bloodType: 'O+',
    allergies: [],
  },
  {
    id: '6',
    name: 'James Wilson',
    age: 38,
    gender: 'Male',
    condition: 'Anxiety Disorder',
    status: 'stable',
    lastVisit: '2026-04-01',
    nextAppointment: '2026-04-08',
    phone: '(555) 678-9012',
    email: 'jwilson@email.com',
    bloodType: 'A-',
    allergies: [],
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '2',
    patientName: 'Michael Chen',
    date: '2026-04-07',
    time: '09:00',
    duration: 30,
    type: 'Follow-up',
    status: 'scheduled',
    doctor: 'Dr. Martinez',
  },
  {
    id: '2',
    patientId: '6',
    patientName: 'James Wilson',
    date: '2026-04-07',
    time: '10:00',
    duration: 45,
    type: 'Consultation',
    status: 'scheduled',
    doctor: 'Dr. Lee',
  },
  {
    id: '3',
    patientId: '4',
    patientName: 'David Thompson',
    date: '2026-04-07',
    time: '11:30',
    duration: 30,
    type: 'Post-op Check',
    status: 'in-progress',
    doctor: 'Dr. Martinez',
  },
  {
    id: '4',
    patientId: '1',
    patientName: 'Sarah Johnson',
    date: '2026-04-07',
    time: '14:00',
    duration: 30,
    type: 'Check-up',
    status: 'scheduled',
    doctor: 'Dr. Kumar',
  },
  {
    id: '5',
    patientId: '5',
    patientName: 'Lisa Anderson',
    date: '2026-04-08',
    time: '09:30',
    duration: 30,
    type: 'Follow-up',
    status: 'scheduled',
    doctor: 'Dr. Lee',
  },
  {
    id: '6',
    patientId: '3',
    patientName: 'Emily Rodriguez',
    date: '2026-04-08',
    time: '10:30',
    duration: 30,
    type: 'Routine Check',
    status: 'scheduled',
    doctor: 'Dr. Kumar',
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    patientName: 'Sarah Johnson',
    date: '2026-03-15',
    amount: 250,
    status: 'paid',
    services: ['Consultation', 'Blood Pressure Monitoring'],
  },
  {
    id: 'INV-002',
    patientName: 'Michael Chen',
    date: '2026-04-02',
    amount: 450,
    status: 'pending',
    services: ['Follow-up', 'Lab Tests', 'Prescription'],
  },
  {
    id: 'INV-003',
    patientName: 'David Thompson',
    date: '2026-04-05',
    amount: 1200,
    status: 'pending',
    services: ['Post-op Consultation', 'Wound Care', 'X-Ray'],
  },
  {
    id: 'INV-004',
    patientName: 'Emily Rodriguez',
    date: '2026-03-20',
    amount: 180,
    status: 'paid',
    services: ['Consultation', 'Inhaler Prescription'],
  },
  {
    id: 'INV-005',
    patientName: 'James Wilson',
    date: '2026-02-28',
    amount: 320,
    status: 'overdue',
    services: ['Therapy Session', 'Prescription'],
  },
];
