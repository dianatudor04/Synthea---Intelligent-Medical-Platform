import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Bell, Lock, Globe, Moon, Shield, LogOut, Database, Sparkles, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { useAuth } from '../../../lib/auth';
import { consentApi } from '../../../lib/services';
import { setTrackingEnabled } from '../../../lib/events';
import type { ConsentFlags } from '../../../lib/types';

type ConsentFlag = 'analytics' | 'profiling' | 'marketingEmail';

const CONSENT_ITEMS: { flag: ConsentFlag; title: string; description: string; icon: typeof Database }[] = [
  {
    flag: 'analytics',
    title: 'Activity analytics',
    description: 'Let us record how you use the app (pages, blog reading, chat) to improve your experience.',
    icon: Database,
  },
  {
    flag: 'profiling',
    title: 'Personalized health insights',
    description: 'Allow AI to analyze your uploaded documents to surface relevant, curated health recommendations. Processes health data.',
    icon: Sparkles,
  },
  {
    flag: 'marketingEmail',
    title: 'Marketing emails',
    description: 'Receive occasional health tips and recommendations by email. You can unsubscribe at any time.',
    icon: Mail,
  },
];

export function PatientSettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    darkMode: false,
    language: 'en',
  });

  const [consent, setConsent] = useState<ConsentFlags | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [savingFlag, setSavingFlag] = useState<ConsentFlag | null>(null);

  useEffect(() => {
    consentApi
      .get()
      .then(setConsent)
      .catch(() => setConsentError('Could not load your privacy settings.'));
  }, []);

  const toggleConsent = async (flag: ConsentFlag, value: boolean) => {
    if (!consent) return;
    setConsentError(null);
    setSavingFlag(flag);
    const previous = consent;
    setConsent({ ...consent, [flag]: value }); // optimistic
    try {
      const updated = await consentApi.update({ [flag]: value });
      setConsent(updated);
      // Sync the in-memory activity tracker immediately so toggling analytics
      // takes effect without a page reload.
      if (flag === 'analytics') setTrackingEnabled(value);
    } catch {
      setConsent(previous); // revert
      setConsentError('Could not save that change. Please try again.');
    } finally {
      setSavingFlag(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA]/30 via-white to-[#E8F5E9]/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => navigate('/patient')}
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your preferences and account</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E6F0FA] rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#3A7BD5]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications in the app</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive text message updates</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, smsNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Appointment Reminders</p>
                  <p className="text-sm text-gray-500">Get reminded before appointments</p>
                </div>
                <Switch
                  checked={settings.appointmentReminders}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, appointmentReminders: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                <Moon className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Toggle dark theme</p>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, darkMode: checked })
                }
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Data & Personalization</h2>
                <p className="text-sm text-gray-500">Control how your data is used. You can change these anytime.</p>
              </div>
            </div>

            {consentError && (
              <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2">{consentError}</div>
            )}

            <div className="space-y-4">
              {CONSENT_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.flag}
                    className={`flex items-start justify-between gap-4 py-3 ${
                      idx < CONSENT_ITEMS.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={consent?.[item.flag] ?? false}
                      disabled={!consent || savingFlag === item.flag}
                      onCheckedChange={(checked) => toggleConsent(item.flag, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#E6F0FA] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#3A7BD5]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
            </div>

            <button
              onClick={() => navigate('/patient/change-password')}
              className="w-full flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors rounded-xl px-3"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-500">Update your password</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition-colors rounded-xl px-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Language</p>
                  <p className="text-sm text-gray-500">English (US)</p>
                </div>
              </div>
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 gap-2"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
