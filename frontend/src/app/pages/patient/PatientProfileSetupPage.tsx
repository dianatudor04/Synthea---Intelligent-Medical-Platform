import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { User, Calendar, AlertCircle, FileText, CheckCircle, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../../lib/auth';
import { patientsApi } from '../../../lib/services';
import { ApiRequestError } from '../../../lib/api';

const COMMON_ALLERGIES = [
  'Penicillin', 'Peanuts', 'Tree nuts', 'Shellfish', 'Eggs', 'Milk', 'Soy',
  'Wheat', 'Fish', 'Latex', 'Aspirin', 'Ibuprofen', 'Sulfa drugs', 'Pollen',
];

const COMMON_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis',
  'Depression', 'Anxiety', 'COPD', 'Kidney Disease', 'Thyroid Disorder',
];

export function PatientProfileSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: 'OTHER' as 'MALE' | 'FEMALE' | 'OTHER',
    allergies: [] as string[],
    conditions: [] as string[],
    medicalInfo: '',
  });
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);

  const addAllergy = (allergy: string) => {
    if (allergy.trim() && !formData.allergies.includes(allergy.trim())) {
      setFormData({ ...formData, allergies: [...formData.allergies, allergy.trim()] });
      setAllergyInput('');
      setShowAllergyDropdown(false);
    }
  };
  const removeAllergy = (idx: number) =>
    setFormData({ ...formData, allergies: formData.allergies.filter((_, i) => i !== idx) });

  const addCondition = (condition: string) => {
    if (condition.trim() && !formData.conditions.includes(condition.trim())) {
      setFormData({ ...formData, conditions: [...formData.conditions, condition.trim()] });
      setConditionInput('');
      setShowConditionDropdown(false);
    }
  };
  const removeCondition = (idx: number) =>
    setFormData({ ...formData, conditions: formData.conditions.filter((_, i) => i !== idx) });

  const filteredAllergies = COMMON_ALLERGIES.filter((a) => a.toLowerCase().includes(allergyInput.toLowerCase()));
  const filteredConditions = COMMON_CONDITIONS.filter((c) => c.toLowerCase().includes(conditionInput.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.dateOfBirth) return;
      setStep(2);
      return;
    }

    if (!user) {
      setSubmitError('You must be signed in to complete profile setup.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      // Conditions and free-text are stored in localStorage as a UI-only convenience
      // (the backend PatientProfile schema doesn't have a "conditions" column).
      const localExtras = {
        conditions: formData.conditions,
        medicalInfo: formData.medicalInfo,
      };
      localStorage.setItem('patientExtras', JSON.stringify(localExtras));

      await patientsApi.create({
        userId: user.id,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        gender: formData.gender,
        allergies: formData.allergies,
      });
      navigate('/patient');
    } catch (err) {
      // 409 — profile already exists; that's fine, just go home
      if (err instanceof ApiRequestError && err.status === 409) {
        navigate('/patient');
        return;
      }
      const message = err instanceof ApiRequestError ? err.message : 'Could not save profile';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA] via-white to-[#E8F5E9] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= 1 ? 'bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <div className={`h-1 w-24 ${step >= 2 ? 'bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50]' : 'bg-gray-200'}`} />
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= 2 ? 'bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  2
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                <p className="text-gray-600">{step === 1 ? 'Tell us about yourself' : 'Medical information'}</p>
              </div>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{submitError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  {user && (
                    <div className="p-3 rounded-xl bg-[#E6F0FA]/40 text-sm">
                      <span className="text-gray-600">Signed in as </span>
                      <span className="font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        className="pl-10 h-12 rounded-xl"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                      <select
                        id="gender"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white"
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })
                        }
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other / Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <div className="relative mt-2">
                      <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                      <Input
                        id="allergies"
                        type="text"
                        placeholder="Search or add allergies"
                        className="pl-10 h-12 rounded-xl"
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
                    {formData.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.allergies.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 bg-[#E6F0FA] text-[#3A7BD5] px-3 py-1.5 rounded-full text-sm"
                          >
                            {a}
                            <button type="button" onClick={() => removeAllergy(i)} className="hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="conditions">Medical Conditions</Label>
                    <div className="relative mt-2">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                      <Input
                        id="conditions"
                        type="text"
                        placeholder="Search or add conditions"
                        className="pl-10 h-12 rounded-xl"
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
                    {formData.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.conditions.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 bg-[#E8F5E9] text-[#4CAF50] px-3 py-1.5 rounded-full text-sm"
                          >
                            {c}
                            <button type="button" onClick={() => removeCondition(i)} className="hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="medicalInfo">Additional Notes (Optional)</Label>
                    <div className="relative mt-2">
                      <Textarea
                        id="medicalInfo"
                        placeholder="Any other relevant medical information..."
                        className="pt-3 min-h-32 rounded-xl resize-none"
                        value={formData.medicalInfo}
                        onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button type="button" onClick={() => setStep(step - 1)} variant="outline" className="flex-1 h-12 rounded-xl">
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`${step === 1 ? 'w-full' : 'flex-1'} h-12 bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 rounded-xl`}
                >
                  {submitting ? 'Saving...' : step === 2 ? 'Complete Setup' : 'Continue'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
