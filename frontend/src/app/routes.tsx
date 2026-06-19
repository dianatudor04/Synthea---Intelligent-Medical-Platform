import { createBrowserRouter } from 'react-router';
import { TelemetryRoot } from './components/TelemetryRoot';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { RequireAuth } from '../lib/RequireAuth';

// Doctor imports
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { SchedulePage } from './pages/SchedulePage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { BillingPage } from './pages/BillingPage';
import { Layout } from './components/Layout';

// Patient imports
import { PatientLayout } from './components/PatientLayout';
import { PatientHomePage } from './pages/patient/PatientHomePage';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage';
import { PatientHistoryPage } from './pages/patient/PatientHistoryPage';
import { PatientChatPage } from './pages/patient/PatientChatPage';
import { PatientNotificationsPage } from './pages/patient/PatientNotificationsPage';
import { PatientSignupPage } from './pages/patient/PatientSignupPage';
import { PatientLoginPage } from './pages/patient/PatientLoginPage';
import { PatientForgotPasswordPage } from './pages/patient/PatientForgotPasswordPage';
import { PatientProfileSetupPage } from './pages/patient/PatientProfileSetupPage';
import { PatientBlogPage } from './pages/patient/PatientBlogPage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { PatientSettingsPage } from './pages/patient/PatientSettingsPage';
import { PatientDoctorProfilePage } from './pages/patient/PatientDoctorProfilePage';

// Nurse imports
import { NurseLayout } from './components/NurseLayout';
import { NursePatientListPage } from './pages/nurse/NursePatientListPage';
import { NurseTasksPage } from './pages/nurse/NurseTasksPage';
import { NurseNotificationsPage } from './pages/nurse/NurseNotificationsPage';

// Admin imports
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';
import { AdminBillingPage } from './pages/admin/AdminBillingPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';

export const router = createBrowserRouter([
  {
    // Pathless root: hosts app-wide telemetry (and renders every route via Outlet).
    element: <TelemetryRoot />,
    children: [
  { path: '/', Component: RoleSelectionPage },
  { path: '/auth/staff-login', Component: StaffLoginPage },

  // Patient auth (public)
  { path: '/patient/auth/signup', Component: PatientSignupPage },
  { path: '/patient/auth/login', Component: PatientLoginPage },
  { path: '/patient/auth/forgot-password', Component: PatientForgotPasswordPage },
  {
    path: '/patient/auth/profile-setup',
    element: (
      <RequireAuth roles={['PATIENT']}>
        <PatientProfileSetupPage />
      </RequireAuth>
    ),
  },

  // Doctor (auth required)
  {
    path: '/doctor',
    element: (
      <RequireAuth roles={['DOCTOR', 'ADMIN']}>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: DashboardPage },
      { path: 'patients', Component: PatientsPage },
      { path: 'patients/:id', Component: PatientDetailPage },
      { path: 'schedule', Component: SchedulePage },
      { path: 'ai-assistant', Component: AIAssistantPage },
      { path: 'billing', Component: BillingPage },
    ],
  },

  // Patient (auth required)
  {
    path: '/patient',
    element: (
      <RequireAuth roles={['PATIENT']}>
        <PatientLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: PatientHomePage },
      { path: 'appointments', Component: PatientAppointmentsPage },
      { path: 'history', Component: PatientHistoryPage },
      { path: 'chat', Component: PatientChatPage },
      { path: 'notifications', Component: PatientNotificationsPage },
      { path: 'blog', Component: PatientBlogPage },
      { path: 'profile', Component: PatientProfilePage },
      { path: 'settings', Component: PatientSettingsPage },
      { path: 'doctors/:id', Component: PatientDoctorProfilePage },
    ],
  },

  // Nurse (auth required)
  {
    path: '/nurse',
    element: (
      <RequireAuth roles={['NURSE', 'ADMIN']}>
        <NurseLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: NursePatientListPage },
      { path: 'tasks', Component: NurseTasksPage },
      { path: 'notifications', Component: NurseNotificationsPage },
    ],
  },

  // Admin (auth required)
  {
    path: '/admin',
    element: (
      <RequireAuth roles={['ADMIN']}>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: AdminDashboardPage },
      { path: 'staff', Component: AdminStaffPage },
      { path: 'content', Component: AdminContentPage },
      { path: 'billing', Component: AdminBillingPage },
      { path: 'settings', Component: AdminSettingsPage },
    ],
  },
    ],
  },
]);
