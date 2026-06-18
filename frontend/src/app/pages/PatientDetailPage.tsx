import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Phone, Mail, Calendar, AlertCircle, FileText, Activity, Plus, Lock, X, AlertTriangle, Pill, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { patientsApi, interactionsApi } from '../../lib/services';
import { ApiRequestError } from '../../lib/api';
import { Appointment, MedicalRecord, PatientProfile, DrugInteraction, InteractionLevel } from '../../lib/types';

function ageFromDob(dob: string) {
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// Color treatment per interaction severity.
const LEVEL_STYLES: Record<InteractionLevel, string> = {
  Major: 'bg-[#FFEBEE] text-[#C62828]',
  Moderate: 'bg-[#FFF3E0] text-[#E65100]',
  Minor: 'bg-[#FFF8E1] text-[#F9A825]',
  Unknown: 'bg-gray-100 text-gray-600',
};

export function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<(PatientProfile & { appointments: Appointment[]; medicalRecords: MedicalRecord[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── New medical record dialog ───────────────────────────────
  const emptyForm = {
    diagnosis: '',
    symptoms: '',
    treatment: '',
    prescription: '',
    notes: '',
    isConfidential: false,
  };
  const [recordOpen, setRecordOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Medications + drug-interaction checking ─────────────────
  const [medications, setMedications] = useState<string[]>([]);
  const [drugQuery, setDrugQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  function openRecordDialog() {
    setForm(emptyForm);
    setFormError(null);
    setMedications([]);
    setDrugQuery('');
    setSuggestions([]);
    setInteractions([]);
    setRecordOpen(true);
  }

  function addMedication(name: string) {
    const drug = name.trim();
    if (!drug) return;
    setMedications((prev) =>
      prev.some((m) => m.toLowerCase() === drug.toLowerCase()) ? prev : [...prev, drug],
    );
    setDrugQuery('');
    setSuggestions([]);
  }

  function removeMedication(name: string) {
    setMedications((prev) => prev.filter((m) => m !== name));
  }

  // Debounced autocomplete against the DDInter drug dictionary.
  useEffect(() => {
    const q = drugQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      interactionsApi
        .searchDrugs(q, 8)
        .then((res) => setSuggestions(res.drugs))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [drugQuery]);

  // Re-check interactions whenever the medication set changes.
  useEffect(() => {
    if (medications.length < 2) {
      setInteractions([]);
      return;
    }
    let cancelled = false;
    setCheckingInteractions(true);
    interactionsApi
      .check(medications)
      .then((res) => !cancelled && setInteractions(res.interactions))
      .catch(() => !cancelled && setInteractions([]))
      .finally(() => !cancelled && setCheckingInteractions(false));
    return () => {
      cancelled = true;
    };
  }, [medications]);

  async function handleCreateRecord() {
    if (!id) return;
    if (
      !form.diagnosis.trim() &&
      !form.treatment.trim() &&
      !form.prescription.trim() &&
      !form.notes.trim() &&
      medications.length === 0
    ) {
      setFormError('Add at least a diagnosis, treatment, medication, or note.');
      return;
    }
    setSaving(true);
    setFormError(null);
    // Combine structured medications with any free-text dosage instructions.
    const prescription =
      [medications.join(', '), form.prescription.trim()].filter(Boolean).join('\n') || undefined;
    try {
      const created = await patientsApi.createMedicalRecord(id, {
        diagnosis: form.diagnosis.trim() || undefined,
        symptoms: form.symptoms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        treatment: form.treatment.trim() || undefined,
        prescription,
        notes: form.notes.trim() || undefined,
        isConfidential: form.isConfidential,
      });
      setPatient((prev) =>
        prev ? { ...prev, medicalRecords: [created, ...prev.medicalRecords] } : prev,
      );
      setRecordOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Could not save the medical record.');
    } finally {
      setSaving(false);
    }
  }

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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#3A7BD5]" />
              Medical Records
            </h3>
            <Button onClick={openRecordDialog} className="gap-2 bg-[#3A7BD5] hover:bg-[#3169b8]">
              <Plus className="w-4 h-4" />
              New Record
            </Button>
          </div>
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
                <div className="flex items-center gap-2 self-start lg:self-center">
                  {rec.isConfidential && (
                    <Badge className="bg-[#FFF3E0] text-[#E65100] border-0 text-xs gap-1">
                      <Lock className="w-3 h-3" />
                      Confidential
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
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

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Medical Record</DialogTitle>
            <DialogDescription>
              Issue a diagnosis, treatment, and prescription for {fullName || 'this patient'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                value={form.diagnosis}
                onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                placeholder="e.g. Acute bronchitis"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Input
                id="symptoms"
                value={form.symptoms}
                onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
                placeholder="Comma-separated, e.g. cough, fever"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment</Label>
              <Textarea
                id="treatment"
                value={form.treatment}
                onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))}
                placeholder="Treatment plan"
              />
            </div>

            <div className="space-y-2">
              <Label>Medications</Label>
              {medications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {medications.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 rounded-full bg-[#E6F0FA] text-[#3A7BD5] text-sm pl-3 pr-2 py-1"
                    >
                      <Pill className="w-3 h-3" />
                      {m}
                      <button
                        type="button"
                        onClick={() => removeMedication(m)}
                        className="ml-0.5 rounded-full hover:text-[#C62828]"
                        aria-label={`Remove ${m}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <Input
                  value={drugQuery}
                  onChange={(e) => setDrugQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addMedication(suggestions[0] ?? drugQuery);
                    }
                  }}
                  placeholder="Search a drug to add (e.g. Warfarin)"
                  autoComplete="off"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => addMedication(s)}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Pick from the list so interactions can be checked.</p>

              {checkingInteractions && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking interactions…
                </div>
              )}
              {!checkingInteractions && medications.length >= 2 && interactions.length === 0 && (
                <div className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                  No known interactions among the selected medications.
                </div>
              )}
              {interactions.length > 0 && (
                <div className="rounded-xl border border-[#FFCDD2] bg-[#FFF5F5] p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[#C62828] font-medium text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {interactions.length} potential interaction{interactions.length > 1 ? 's' : ''} detected
                  </div>
                  {interactions.map((it, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-700">
                        <span className="font-medium">{it.drugA}</span> + <span className="font-medium">{it.drugB}</span>
                      </span>
                      <Badge className={`${LEVEL_STYLES[it.level]} border-0`}>{it.level}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescription">Dosage &amp; instructions</Label>
              <Textarea
                id="prescription"
                value={form.prescription}
                onChange={(e) => setForm((f) => ({ ...f, prescription: e.target.value }))}
                placeholder="e.g. 500mg, 3x/day for 7 days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="confidential"
                checked={form.isConfidential}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isConfidential: checked === true }))}
              />
              <Label htmlFor="confidential" className="cursor-pointer">
                Mark as confidential
              </Label>
            </div>

            {formError && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{formError}</div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreateRecord} disabled={saving} className="bg-[#3A7BD5] hover:bg-[#3169b8]">
              {saving ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
