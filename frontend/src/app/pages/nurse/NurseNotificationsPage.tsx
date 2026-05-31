import { AlertCircle, Clock, Activity, Bell } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export function NurseNotificationsPage() {
  const alerts = [
    {
      id: '1',
      type: 'urgent',
      title: 'Critical Patient Alert',
      message: 'Patient in Room 304 vitals outside normal range',
      patient: 'David Thompson',
      time: 'Just now',
      icon: AlertCircle,
      color: 'text-[#F44336]',
      bg: 'bg-[#FFEBEE]',
    },
    {
      id: '2',
      type: 'medication',
      title: 'Medication Due',
      message: 'Lisinopril 10mg scheduled for Sarah Johnson',
      patient: 'Sarah Johnson',
      time: '5 minutes ago',
      icon: Clock,
      color: 'text-[#FF9800]',
      bg: 'bg-[#FFF3E0]',
    },
    {
      id: '3',
      type: 'vitals',
      title: 'Vitals Check Required',
      message: 'Scheduled vitals monitoring for Michael Chen',
      patient: 'Michael Chen',
      time: '15 minutes ago',
      icon: Activity,
      color: 'text-[#3A7BD5]',
      bg: 'bg-[#E6F0FA]',
    },
    {
      id: '4',
      type: 'reminder',
      title: 'Task Reminder',
      message: 'Wound dressing change due in 30 minutes',
      patient: 'David Thompson',
      time: '30 minutes ago',
      icon: Bell,
      color: 'text-[#4CAF50]',
      bg: 'bg-[#E8F5E9]',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Alerts</h2>
        <Badge className="bg-[#F44336] text-white border-0">
          {alerts.filter((a) => a.type === 'urgent').length} Urgent
        </Badge>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <Card
              key={alert.id}
              className={`p-5 border-0 shadow-sm hover:shadow-md transition-all ${
                alert.type === 'urgent' ? 'border-l-4 border-l-[#F44336]' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 ${alert.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-6 h-6 ${alert.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{alert.title}</h3>
                    {alert.type === 'urgent' && (
                      <Badge className="bg-[#F44336] text-white border-0 text-xs shrink-0">
                        URGENT
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{alert.patient}</span>
                    <span>•</span>
                    <span>{alert.time}</span>
                  </div>
                  {alert.type === 'urgent' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-[#F44336] hover:bg-[#E53935] rounded-xl"
                      >
                        View Patient
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
