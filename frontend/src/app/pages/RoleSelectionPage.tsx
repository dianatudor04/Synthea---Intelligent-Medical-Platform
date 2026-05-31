import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { User, Stethoscope, Shield, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../lib/auth';

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already signed in, send the user to their home
  useEffect(() => {
    if (!user) return;
    if (user.role === 'PATIENT') navigate('/patient', { replace: true });
    else if (user.role === 'DOCTOR') navigate('/doctor', { replace: true });
    else if (user.role === 'NURSE') navigate('/nurse', { replace: true });
    else if (user.role === 'ADMIN') navigate('/admin', { replace: true });
  }, [user, navigate]);

  const roles = [
    { id: 'patient', title: 'Patient', icon: User, path: '/patient/auth/login' },
    { id: 'doctor', title: 'Doctor', icon: Stethoscope, path: '/auth/staff-login?role=DOCTOR' },
    { id: 'nurse', title: 'Nurse', icon: Activity, path: '/auth/staff-login?role=NURSE' },
    { id: 'admin', title: 'Admin', icon: Shield, path: '/auth/staff-login?role=ADMIN' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA] via-white to-[#E8F5E9] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] rounded-3xl mb-8 shadow-xl"
          >
            <Activity className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-gray-900 mb-4"
          >
            Welcome
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600"
          >
            Please choose your profile to continue
          </motion.p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-12">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(role.path)}
                className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all cursor-pointer group border border-gray-100"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#E6F0FA] to-[#E8F5E9] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-[#3A7BD5]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{role.title}</h3>
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-sm text-gray-500"
        >
          <p>Secure • HIPAA Compliant • 24/7 Support</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
