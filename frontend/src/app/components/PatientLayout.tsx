import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import {
  Home,
  Calendar,
  FileText,
  MessageSquare,
  Bell,
  Menu,
  X,
  ArrowLeft,
  User,
  BookOpen,
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { FloatingChatbot } from './patient/FloatingChatbot';

const navigationItems = [
  { path: '/patient', label: 'Home', icon: Home },
  { path: '/patient/appointments', label: 'Appointments', icon: Calendar },
  { path: '/patient/blog', label: 'Wellness', icon: BookOpen },
  { path: '/patient/chat', label: 'Ask AI', icon: MessageSquare },
  { path: '/patient/notifications', label: 'Alerts', icon: Bell },
];

export function PatientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="pb-20 lg:pb-0">
        <main>
          <Outlet />
        </main>
      </div>

      {/* Global assistant + recommendation balloon (all patient pages) */}
      <FloatingChatbot />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 z-40 lg:hidden safe-area-bottom shadow-2xl">
        <div className="h-full flex items-center justify-around px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl flex-1 transition-all
                  ${isActive ? 'text-[#3A7BD5] bg-[#E6F0FA]/50' : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.label === 'Alerts' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#F44336] rounded-full animate-pulse" />
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
