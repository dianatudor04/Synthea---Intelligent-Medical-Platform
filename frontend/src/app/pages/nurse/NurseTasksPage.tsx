import { CheckCircle2, Clock, AlertCircle, Pill, Activity, Droplet } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';

export function NurseTasksPage() {
  const tasks = [
    {
      id: '1',
      patient: 'Sarah Johnson',
      room: '301',
      task: 'Administer medication',
      medication: 'Lisinopril 10mg',
      time: '2:00 PM',
      priority: 'high',
      completed: false,
      icon: Pill,
    },
    {
      id: '2',
      patient: 'Michael Chen',
      room: '302',
      task: 'Check vitals',
      detail: 'Blood pressure and heart rate',
      time: '2:30 PM',
      priority: 'medium',
      completed: false,
      icon: Activity,
    },
    {
      id: '3',
      patient: 'David Thompson',
      room: '304',
      task: 'Wound dressing change',
      detail: 'Post-surgery care',
      time: '3:00 PM',
      priority: 'high',
      completed: false,
      icon: AlertCircle,
    },
    {
      id: '4',
      patient: 'Emily Rodriguez',
      room: '303',
      task: 'IV fluid check',
      detail: 'Saline solution',
      time: '3:30 PM',
      priority: 'low',
      completed: false,
      icon: Droplet,
    },
    {
      id: '5',
      patient: 'Lisa Anderson',
      room: '305',
      task: 'Temperature check',
      detail: 'Routine monitoring',
      time: '1:00 PM',
      priority: 'medium',
      completed: true,
      icon: Activity,
    },
  ];

  const priorityColors = {
    high: 'border-l-[#F44336]',
    medium: 'border-l-[#FF9800]',
    low: 'border-l-[#4CAF50]',
  };

  const priorityBadges = {
    high: 'bg-[#FFEBEE] text-[#F44336]',
    medium: 'bg-[#FFF3E0] text-[#FF9800]',
    low: 'bg-[#E8F5E9] text-[#4CAF50]',
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">My Tasks</h2>
          <p className="text-gray-500 mt-1">
            {pending.length} pending • {completed.length} completed
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-0 shadow-sm text-center">
          <div className="text-2xl font-bold text-[#F44336]">
            {pending.filter((t) => t.priority === 'high').length}
          </div>
          <div className="text-xs text-gray-500 mt-1">High Priority</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm text-center">
          <div className="text-2xl font-bold text-[#FF9800]">{pending.length}</div>
          <div className="text-xs text-gray-500 mt-1">To Do</div>
        </Card>
        <Card className="p-4 border-0 shadow-sm text-center">
          <div className="text-2xl font-bold text-[#4CAF50]">{completed.length}</div>
          <div className="text-xs text-gray-500 mt-1">Done Today</div>
        </Card>
      </div>

      {/* Pending Tasks */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Pending Tasks</h3>
          {pending.map((task) => {
            const Icon = task.icon;
            return (
              <Card
                key={task.id}
                className={`p-5 border-0 border-l-4 ${
                  priorityColors[task.priority as keyof typeof priorityColors]
                } shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={task.id}
                    className="mt-1 w-6 h-6 border-2 rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{task.task}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {task.medication || task.detail}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          priorityBadges[task.priority as keyof typeof priorityBadges]
                        } border-0 text-xs shrink-0`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {task.time}
                      </span>
                      <span>•</span>
                      <span>{task.patient}</span>
                      <span>•</span>
                      <span>Room {task.room}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-[#FF9800] hover:bg-[#E68900] rounded-xl"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl">
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Completed</h3>
          {completed.map((task) => {
            const Icon = task.icon;
            return (
              <Card
                key={task.id}
                className="p-5 border-0 shadow-sm bg-gray-50 opacity-75"
              >
                <div className="flex items-start gap-4">
                  <Checkbox id={task.id} checked className="mt-1 w-6 h-6 rounded-lg" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-600 line-through">
                      {task.task}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <span>{task.patient}</span>
                      <span>•</span>
                      <span>Room {task.room}</span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#4CAF50] flex-shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}