import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { Users, ClipboardList, Bell, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuth } from '../../lib/auth';

const navigationItems = [
  { path: '/nurse', label: 'Patients', icon: Users, end: true },
  { path: '/nurse/tasks', label: 'Tasks', icon: ClipboardList },
  { path: '/nurse/notifications', label: 'Alerts', icon: Bell },
];

export function NurseLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'EN';
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[#FF9800]">Synthea</h1>
          <p className="text-xs text-gray-500">{user ? `${user.firstName} ${user.lastName}` : 'Nurse Dashboard'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#F44336] rounded-full" />
          </Button>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-[#FF9800] text-white text-sm">{initials}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
            <LogOut className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-20">
        <main className="p-4">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 z-50">
        <div className="h-full flex items-center justify-around px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={`
                  flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl flex-1
                  ${isActive ? 'text-[#FF9800]' : 'text-gray-500'}
                `}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.label === 'Alerts' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#F44336] rounded-full" />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
