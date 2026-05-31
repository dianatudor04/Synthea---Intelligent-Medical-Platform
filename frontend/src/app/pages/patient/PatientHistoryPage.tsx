import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Calendar } from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { authApi, patientsApi } from '../../../lib/services';
import { MedicalRecord } from '../../../lib/types';

export function PatientHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      try {
        const profile = await authApi.profile();
        const patientId = profile.patientProfile?.id;
        if (!patientId) {
          if (!cancelled) setRecords([]);
          return;
        }
        const res = await patientsApi.medicalRecords(patientId, { page: 1, limit: 50 });
        if (!cancelled) setRecords(res.data);
      } catch {
        if (!cancelled) setError('Could not load medical history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA]/30 via-white to-[#E8F5E9]/30">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-gray-900">Medical History</h1>
          <p className="text-gray-600">Your complete record of consultations and diagnoses.</p>
        </motion.div>

        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && records.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            No records yet.
          </div>
        )}

        <div className="space-y-3">
          {records.map((rec) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{rec.diagnosis || 'Consultation note'}</h4>
                  {rec.doctor && (
                    <p className="text-sm text-gray-500">
                      by Dr. {rec.doctor.firstName} {rec.doctor.lastName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {rec.symptoms && rec.symptoms.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Symptoms</span>
                  <p className="text-sm text-gray-800">{rec.symptoms.join(', ')}</p>
                </div>
              )}
              {rec.treatment && (
                <div className="mb-2">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Treatment</span>
                  <p className="text-sm text-gray-800">{rec.treatment}</p>
                </div>
              )}
              {rec.prescription && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-gray-500">Prescription</span>
                  <p className="text-sm text-gray-800">{rec.prescription}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
