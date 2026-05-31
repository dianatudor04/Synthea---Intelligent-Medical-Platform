import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Phone, Mail, Calendar, AlertCircle, FileText, Activity } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { patientsApi } from '../../lib/services';
import { Appointment, MedicalRecord, PatientProfile } from '../../lib/types';

function ageFromDob(dob: string) {
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<(PatientProfile & { appointments: Appointment[]; medicalRecords: MedicalRecord[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    patientsApi
      .get(id)
      .then((res) => !cancelled && setPatient(res))
      .catch(() => !cancelled && setError('Could not load patient'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#3A7BD5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !patient) {
    return <div className="text-center py-12 text-gray-500">{error || 'Patient not found'}</div>;
  }

  const u = patient.user;
  const fullName = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
  const initials = `${u?.firstName?.[0] ?? '?'}${u?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 lg:pb-6">
      <Button variant="ghost" onClick={() => navigate('/doctor/patients')} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Patients
      </Button>

      <Card className="p-6 lg:p-8 border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-[#3A7BD5] to-[#5B9BD5] flex items-center justify-center text-white font-semibold text-3xl flex-shrink-0">
            {initials}
          </div>

          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-2">{fullName || 'Patient'}</h1>
                <div className="flex flex-wrap items-center gap-3 text-gray-600">
                  <span>{ageFromDob(patient.dateOfBirth)} years</span>
                  <span>•</span>
                  <span>{patient.gender}</span>
                  {patient.bloodType && (
                    <>
                      <span>•</span>
                      <span>Blood: {patient.bloodType}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-[#3A7BD5]" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-800">{u?.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-[#3A7BD5]" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">{u?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Activity className="w-5 h-5 text-[#3A7BD5]" />
                <div>
                  <p className="text-xs text-gray-500">Insurance</p>
                  <p className="text-sm font-medium text-gray-800">{patient.insuranceNo || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">
            History
          </TabsTrigger>
          <TabsTrigger value="appointments" className="rounded-lg">
            Appointments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#3A7BD5]" />
              Patient Profile
            </h3>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Allergies</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patient.allergies.length > 0 ? (
                      patient.allergies.map((a, i) => (
                        <Badge key={i} className="bg-[#FFEBEE] text-[#F44336] border-0">
                          {a}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">None reported</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-800">
                    {patient.address ? `${patient.address}, ${patient.city ?? ''}, ${patient.country}` : '—'}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Emergency Contact</p>
                  <p className="font-medium text-gray-800">{patient.emergencyContact || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CNP</p>
                  <p className="font-medium text-gray-800">{patient.cnp || '—'}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {patient.medicalRecords.length === 0 && (
            <Card className="p-8 border-0 shadow-sm text-center text-gray-500">No medical records yet.</Card>
          )}
          {patient.medicalRecords.map((rec) => (
            <Card key={rec.id} className="p-6 border-0 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">{rec.diagnosis || 'Consultation'}</h4>
                  {rec.doctor && (
                    <p className="text-sm text-gray-500">
                      Dr. {rec.doctor.firstName} {rec.doctor.lastName}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs self-start lg:self-center">
                  {new Date(rec.createdAt).toLocaleDateString()}
                </Badge>
              </div>
              {rec.symptoms.length > 0 && (
                <p className="text-sm text-gray-600">Symptoms: {rec.symptoms.join(', ')}</p>
              )}
              {rec.treatment && <p className="text-sm text-gray-600 mt-1">Treatment: {rec.treatment}</p>}
              {rec.prescription && <p className="text-sm text-gray-600 mt-1">Prescription: {rec.prescription}</p>}
              {rec.notes && <p className="text-sm text-gray-600 mt-2">{rec.notes}</p>}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          {patient.appointments.length === 0 && (
            <Card className="p-8 border-0 shadow-sm text-center text-gray-500">No appointments.</Card>
          )}
          {patient.appointments.map((appt) => (
            <Card key={appt.id} className="p-5 border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#E6F0FA] rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#3A7BD5]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{appt.reason || 'Consultation'}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(appt.scheduledAt).toLocaleString()} • {appt.duration} min
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{appt.status.toLowerCase()}</Badge>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
