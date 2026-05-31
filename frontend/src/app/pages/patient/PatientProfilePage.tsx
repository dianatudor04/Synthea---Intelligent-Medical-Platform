import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  FileText,
  Edit2,
  Save,
  X,
  Phone,
  MapPin,
  Droplet,
  IdCard,
  HeartPulse,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../../lib/auth';
import { authApi, patientsApi } from '../../../lib/services';
import { ApiRequestError } from '../../../lib/api';

const COMMON_ALLERGIES = [
  'Penicillin', 'Peanuts', 'Tree nuts', 'Shellfish', 'Eggs', 'Milk', 'Soy',
  'Wheat', 'Fish', 'Latex', 'Aspirin', 'Ibuprofen', 'Sulfa drugs', 'Pollen',
];

const COMMON_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis',
  'Depression', 'Anxiety', 'COPD', 'Kidney Disease', 'Thyroid Disorder',
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  bloodType: string;
  allergies: string[];
  cnp: string;
  insuranceNo: string;
  emergencyContact: string;
  address: string;
  city: string;
  country: string;
  conditions: string[]; // local-only
  medicalInfo: string; // local-only
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  gender: 'OTHER',
  bloodType: '',
  allergies: [],
  cnp: '',
  insuranceNo: '',
  emergencyContact: '',
  address: '',
  city: '',
  country: 'Romania',
  conditions: [],
  medicalInfo: '',
};

export function PatientProfilePage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [savedSnapshot, setSavedSnapshot] = useState<FormState>(emptyForm);

  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);

  const loadProfile = async () => {
    try {
      const profile = await authApi.profile();
      const pp = profile.patientProfile;
      const extras = JSON.parse(localStorage.getItem('patientExtras') || '{}');
      const next: FormState = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? '',
        email: profile.email,
        dateOfBirth: pp?.dateOfBirth ? pp.dateOfBirth.substring(0, 10) : '',
        gender: (pp?.gender as Gender) ?? 'OTHER',
        bloodType: pp?.bloodType ?? '',
        allergies: pp?.allergies ?? [],
        cnp: pp?.cnp ?? '',
        insuranceNo: pp?.insuranceNo ?? '',
        emergencyContact: pp?.emergencyContact ?? '',
        address: pp?.address ?? '',
        city: pp?.city ?? '',
        country: pp?.country ?? 'Romania',
        conditions: extras.conditions ?? [],
        medicalInfo: extras.medicalInfo ?? '',
      };
      setProfileId(pp?.id ?? null);
      setFormData(next);
      setSavedSnapshot(next);
    } catch {
      setError('Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadProfile().catch(() => {
      if (!cancelled) setError('Could not load profile');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    setFormData(savedSnapshot);
    setIsEditing(false);
    setError(null);
    setSuccess(false);
    setAllergyInput('');
    setConditionInput('');
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const tasks: Promise<unknown>[] = [];

      // 1. User-level fields (auth/profile)
      tasks.push(
        authApi.updateProfile({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || undefined,
        })
      );

      // 2. Patient profile fields (only if a profile exists)
      if (profileId) {
        tasks.push(
          patientsApi.update(profileId, {
            dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
            gender: formData.gender,
            bloodType: formData.bloodType || undefined,
            allergies: formData.allergies,
            cnp: formData.cnp.trim() || undefined,
            insuranceNo: formData.insuranceNo.trim() || undefined,
            emergencyContact: formData.emergencyContact.trim() || undefined,
            address: formData.address.trim() || undefined,
            city: formData.city.trim() || undefined,
            country: formData.country.trim() || undefined,
          } as never)
        );
      }

      await Promise.all(tasks);

      // Local-only extras (conditions + free-text notes)
      localStorage.setItem(
        'patientExtras',
        JSON.stringify({ conditions: formData.conditions, medicalInfo: formData.medicalInfo })
      );

      // Refresh auth context so the home greeting picks up the new name
      await refreshProfile();

      // Reload the saved-snapshot from the server so subsequent cancels work correctly
      await loadProfile();

      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not save profile';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = (a: string) => {
    if (a.trim() && !formData.allergies.includes(a.trim())) {
      setFormData({ ...formData, allergies: [...formData.allergies, a.trim()] });
      setAllergyInput('');
      setShowAllergyDropdown(false);
    }
  };
  const removeAllergy = (idx: number) =>
    setFormData({ ...formData, allergies: formData.allergies.filter((_, i) => i !== idx) });
  const addCondition = (c: string) => {
    if (c.trim() && !formData.conditions.includes(c.trim())) {
      setFormData({ ...formData, conditions: [...formData.conditions, c.trim()] });
      setConditionInput('');
      setShowConditionDropdown(false);
    }
  };
  const removeCondition = (idx: number) =>
    setFormData({ ...formData, conditions: formData.conditions.filter((_, i) => i !== idx) });

  const filteredAllergies = COMMON_ALLERGIES.filter((a) =>
    a.toLowerCase().includes(allergyInput.toLowerCase())
  );
  const filteredConditions = COMMON_CONDITIONS.filter((c) =>
    c.toLowerCase().includes(conditionInput.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#3A7BD5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA]/30 via-white to-[#E8F5E9]/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/patient')}
              className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 truncate">My Profile</h1>
              <p className="text-gray-600">Manage your personal and medical information</p>
            </div>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 gap-2 flex-shrink-0"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={handleCancel} variant="outline" className="gap-2" disabled={saving}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </motion.div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
        {success && (
          <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">
            Profile saved successfully.
          </div>
        )}

        {/* ── Personal info ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#3A7BD5]" />
            Personal information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                className="mt-2 h-11 rounded-xl"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                className="mt-2 h-11 rounded-xl"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                className="mt-2 h-11 rounded-xl"
                value={formData.email}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email is managed by your account.</p>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  className="pl-9 h-11 rounded-xl"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+40 700 000 000"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="dateOfBirth"
                  type="date"
                  className="pl-9 h-11 rounded-xl"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="mt-2 w-full h-11 px-3 rounded-xl border border-gray-200 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                disabled={!isEditing}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other / Prefer not to say</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* ── Medical info ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl shadow-lg p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#3A7BD5]" />
            Medical information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bloodType">Blood type</Label>
              <div className="relative mt-2">
                <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  id="bloodType"
                  className="pl-9 w-full h-11 px-3 rounded-xl border border-gray-200 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  disabled={!isEditing}
                >
                  <option value="">Not specified</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="emergencyContact">Emergency contact</Label>
              <Input
                id="emergencyContact"
                className="mt-2 h-11 rounded-xl"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                disabled={!isEditing}
                placeholder="Name and phone number"
              />
            </div>
          </div>

          <div>
            <Label>Allergies</Label>
            {isEditing && (
              <div className="relative mt-2">
                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="Search or add allergies"
                  className="pl-9 h-11 rounded-xl"
                  value={allergyInput}
                  onChange={(e) => {
                    setAllergyInput(e.target.value);
                    setShowAllergyDropdown(true);
                  }}
                  onFocus={() => setShowAllergyDropdown(true)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (allergyInput.trim()) addAllergy(allergyInput);
                    }
                  }}
                />
                {showAllergyDropdown && allergyInput && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredAllergies.length > 0 ? (
                      filteredAllergies.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => addAllergy(a)}
                          className="w-full text-left px-4 py-2 hover:bg-[#E6F0FA] transition-colors"
                        >
                          {a}
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => addAllergy(allergyInput)}
                        className="w-full text-left px-4 py-2 hover:bg-[#E6F0FA] transition-colors text-[#3A7BD5]"
                      >
                        Add "{allergyInput}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {formData.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.allergies.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-[#E6F0FA] text-[#3A7BD5] px-3 py-1.5 rounded-full text-sm"
                  >
                    {a}
                    {isEditing && (
                      <button type="button" onClick={() => removeAllergy(i)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No allergies recorded</p>
            )}
          </div>

          <div>
            <Label>Medical conditions</Label>
            {isEditing && (
              <div className="relative mt-2">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="Search or add conditions"
                  className="pl-9 h-11 rounded-xl"
                  value={conditionInput}
                  onChange={(e) => {
                    setConditionInput(e.target.value);
                    setShowConditionDropdown(true);
                  }}
                  onFocus={() => setShowConditionDropdown(true)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (conditionInput.trim()) addCondition(conditionInput);
                    }
                  }}
                />
                {showConditionDropdown && conditionInput && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredConditions.length > 0 ? (
                      filteredConditions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => addCondition(c)}
                          className="w-full text-left px-4 py-2 hover:bg-[#E6F0FA] transition-colors"
                        >
                          {c}
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => addCondition(conditionInput)}
                        className="w-full text-left px-4 py-2 hover:bg-[#E6F0FA] transition-colors text-[#3A7BD5]"
                      >
                        Add "{conditionInput}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {formData.conditions.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.conditions.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#4CAF50] px-3 py-1.5 rounded-full text-sm"
                  >
                    {c}
                    {isEditing && (
                      <button type="button" onClick={() => removeCondition(i)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No conditions recorded</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Conditions are saved locally on this device.</p>
          </div>

          <div>
            <Label htmlFor="medicalInfo">Additional notes</Label>
            <Textarea
              id="medicalInfo"
              placeholder="Any other relevant medical information..."
              className="mt-2 pt-3 min-h-28 rounded-xl resize-none"
              value={formData.medicalInfo}
              onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
              disabled={!isEditing}
            />
            <p className="text-xs text-gray-400 mt-1">Notes are saved locally on this device.</p>
          </div>
        </motion.div>

        {/* ── Identity & insurance ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-lg p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IdCard className="w-5 h-5 text-[#3A7BD5]" />
            Identity & insurance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cnp">CNP (national ID)</Label>
              <Input
                id="cnp"
                className="mt-2 h-11 rounded-xl"
                value={formData.cnp}
                onChange={(e) => setFormData({ ...formData, cnp: e.target.value })}
                disabled={!isEditing}
                placeholder="13-digit ID"
              />
            </div>
            <div>
              <Label htmlFor="insuranceNo">Insurance number</Label>
              <Input
                id="insuranceNo"
                className="mt-2 h-11 rounded-xl"
                value={formData.insuranceNo}
                onChange={(e) => setFormData({ ...formData, insuranceNo: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Address ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-lg p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#3A7BD5]" />
            Address
          </h2>

          <div>
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              className="mt-2 h-11 rounded-xl"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
              placeholder="Str. Florilor 10, ap. 5"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                className="mt-2 h-11 rounded-xl"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                className="mt-2 h-11 rounded-xl"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
