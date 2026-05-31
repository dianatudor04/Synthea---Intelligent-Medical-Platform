import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Brain,
  FileText,
  Search,
  Bell,
  Menu,
  X,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuth } from '../../lib/auth';

const navigationItems = [
  { path: '/doctor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/doctor/patients', label: 'Patients', icon: Users },
  { path: '/doctor/schedule', label: 'Schedule', icon: Calendar },
  { path: '/doctor/ai-assistant', label: 'AI Assistant', icon: Brain },
  { path: '/doctor/billing', label: 'Billing', icon: FileText },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'DR';
  const displayName = user ? `Dr. ${user.lastName}` : 'Doctor';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-3">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[#3A7BD5]">Synthea</h1>
        </div>
        <Button variant="ghost" size="icon" className="mr-2">
          <Search className="w-5 h-5 text-gray-600" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5 text-gray-600" />
        </Button>
      </div>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-2 lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3A7BD5] to-[#5B9BD5] flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-xl text-gray-800">Synthea</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-[#E6F0FA] text-[#3A7BD5] font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl">
              <Avatar>
                <AvatarFallback className="bg-[#3A7BD5] text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:pl-64">
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center px-8 sticky top-0 z-20">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, appointments..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3A7BD5]/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#3A7BD5] rounded-full" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Avatar>
              <AvatarFallback className="bg-[#3A7BD5] text-white">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="p-4 lg:p-8 mt-16 lg:mt-0">
          <Outlet />
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50">
        <div className="h-full flex items-center justify-around px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg flex-1 ${
                  isActive ? 'text-[#3A7BD5]' : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
