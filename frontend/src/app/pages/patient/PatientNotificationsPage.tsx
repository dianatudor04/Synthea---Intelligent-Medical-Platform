import { Bell, Calendar, Pill, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export function PatientNotificationsPage() {
  const notifications = [
    {
      id: '1',
      type: 'appointment',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Martinez is in 3 days',
      time: '2 hours ago',
      icon: Calendar,
      color: 'text-[#3A7BD5]',
      bg: 'bg-[#E6F0FA]',
      unread: true,
    },
    {
      id: '2',
      type: 'medication',
      title: 'Medication Reminder',
      message: "It's time to take your evening dose of Lisinopril",
      time: '8:00 PM',
      icon: Pill,
      color: 'text-[#4CAF50]',
      bg: 'bg-[#E8F5E9]',
      unread: true,
    },
    {
      id: '3',
      type: 'results',
      title: 'Lab Results Available',
      message: 'Your recent blood test results are now ready to view',
      time: 'Yesterday',
      icon: FileText,
      color: 'text-[#FF9800]',
      bg: 'bg-[#FFF3E0]',
      unread: false,
    },
    {
      id: '4',
      type: 'success',
      title: 'Payment Confirmed',
      message: 'Your payment of $250 has been processed successfully',
      time: '2 days ago',
      icon: CheckCircle2,
      color: 'text-[#4CAF50]',
      bg: 'bg-[#E8F5E9]',
      unread: false,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
        <Badge variant="outline" className="text-xs">
          {notifications.filter((n) => n.unread).length} new
        </Badge>
      </div>

      {notifications.map((notification) => {
        const Icon = notification.icon;
        return (
          <Card
            key={notification.id}
            className={`p-5 border-0 shadow-sm hover:shadow-md transition-shadow ${
              notification.unread ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 ${notification.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-6 h-6 ${notification.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">
                    {notification.title}
                  </h3>
                  {notification.unread && (
                    <div className="w-2 h-2 bg-[#3A7BD5] rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                <p className="text-xs text-gray-400">{notification.time}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}