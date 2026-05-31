import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { CalendarPlus, User, Settings } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { CalendarSection } from '../../components/patient/CalendarSection';
import { AppointmentsSection } from '../../components/patient/AppointmentsSection';
import { MedicalFilesSection } from '../../components/patient/MedicalFilesSection';
import { BlogSection } from '../../components/patient/BlogSection';
import { FloatingChatbot } from '../../components/patient/FloatingChatbot';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal';
import { useAuth } from '../../../lib/auth';

export function PatientHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const firstName = user?.firstName || 'Guest';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA]/30 via-white to-[#E8F5E9]/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Hello, {firstName}</h1>
            <p className="text-gray-600">Welcome back to your health dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/patient/settings')}
              className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/patient/profile')}
              className="w-12 h-12 bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <User className="w-6 h-6 text-white" />
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Button
            onClick={() => setShowBookingModal(true)}
            className="w-full h-20 bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 rounded-3xl text-xl font-semibold shadow-xl hover:shadow-2xl transition-all gap-3"
          >
            <CalendarPlus className="w-8 h-8" />
            Book an Appointment
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" key={refreshKey}>
          <div className="lg:col-span-2 space-y-6">
            <CalendarSection />
            <AppointmentsSection />
            <BlogSection />
          </div>

          <div className="space-y-6">
            <MedicalFilesSection />
          </div>
        </div>
      </div>

      <FloatingChatbot />

      <BookAppointmentModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBooked={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
