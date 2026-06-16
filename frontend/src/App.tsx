import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from './components/LoadingSpinner';
import {
  LayoutDashboard, Search, Calendar, User, Map, ClipboardList, Settings, Shield, FlaskConical,
  Stethoscope, Building2, Users, MessageSquare,
} from 'lucide-react';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AssistantLoginPage = lazy(() => import('./pages/auth/AssistantLoginPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));
const SuperAdminLoginPage = lazy(() => import('./pages/auth/SuperAdminLoginPage'));
const DoctorsSearchPage = lazy(() => import('./pages/patient/DoctorsSearchPage'));
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const DoctorDetailPage = lazy(() => import('./pages/patient/DoctorDetailPage'));
const AppointmentsPage = lazy(() => import('./pages/patient/AppointmentsPage'));
const ProfilePage = lazy(() => import('./pages/patient/ProfilePage'));
const MessagesPage = lazy(() => import('./pages/patient/MessagesPage'));
const MapPage = lazy(() => import('./pages/patient/MapPage'));
const LaboratoriesPage = lazy(() => import('./pages/patient/LaboratoriesPage'));
const AssistantDashboard = lazy(() => import('./pages/assistant/AssistantDashboard'));
const MyDoctorPage = lazy(() => import('./pages/assistant/MyDoctorPage'));
const PlanningPage = lazy(() => import('./pages/assistant/PlanningPage'));
const RequestsPage = lazy(() => import('./pages/assistant/RequestsPage'));
const SchedulesPage = lazy(() => import('./pages/assistant/SchedulesPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminManagementPage = lazy(() => import('./pages/admin/AdminManagementPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
});

const patientNav = [
  { to: '/patient/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/patient/rendez-vous', label: 'Rendez-vous', icon: Calendar },
  { to: '/patient/medecins', label: 'Médecins', icon: Search },
  { to: '/patient/laboratoires', label: 'Laboratoires', icon: FlaskConical },
  { to: '/patient/carte', label: 'Carte', icon: Map },
  { to: '/patient/messages', label: 'Messages', icon: MessageSquare },
  { to: '/patient/parametres', label: 'Paramètres', icon: Settings },
];

const assistantNav = [
  { to: '/assistant/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/assistant/mon-medecin', label: 'Mon médecin', icon: Stethoscope },
  { to: '/assistant/planning', label: 'Planning', icon: Calendar },
  { to: '/assistant/demandes', label: 'Demandes', icon: ClipboardList },
  { to: '/assistant/messages', label: 'Messages', icon: MessageSquare },
];

const adminNav = [
  { to: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/medecins', label: 'Médecins', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/cabinets', label: 'Cabinets', icon: Building2 },
  { to: '/admin/laboratoires', label: 'Laboratoires', icon: FlaskConical },
  { to: '/admin/assistants', label: 'Assistants', icon: User },
  { to: '/admin/rendez-vous', label: 'Rendez-vous', icon: Calendar },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

const superAdminNav = [
  { to: '/super-admin/dashboard', label: 'Supervision', icon: Shield },
  { to: '/super-admin/admins', label: 'Administrateurs', icon: Users },
  { to: '/admin/medecins', label: 'Médecins', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/cabinets', label: 'Cabinets', icon: Building2 },
  { to: '/admin/laboratoires', label: 'Laboratoires', icon: FlaskConical },
  { to: '/admin/assistants', label: 'Assistants', icon: User },
  { to: '/admin/rendez-vous', label: 'Rendez-vous', icon: Calendar },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}

function AdminLayout() {
  const { user } = useAuth();
  const isSuper = user?.role === 'SUPER_ADMIN';
  return (
    <DashboardLayout
      title={isSuper ? 'Super Admin' : 'Administration'}
      navItems={isSuper ? superAdminNav : adminNav}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Lazy><LandingPage /></Lazy>} />
              <Route path="medecins" element={<Lazy><DoctorsSearchPage publicView /></Lazy>} />
              <Route element={<GuestRoute />}>
                <Route path="connexion" element={<Lazy><LoginPage /></Lazy>} />
                <Route path="connexion/assistant" element={<Lazy><AssistantLoginPage /></Lazy>} />
                <Route path="connexion/admin" element={<Lazy><AdminLoginPage /></Lazy>} />
                <Route path="connexion/super-admin" element={<Lazy><SuperAdminLoginPage /></Lazy>} />
                <Route path="inscription" element={<Lazy><RegisterPage /></Lazy>} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['PATIENT']} />}>
              <Route element={<DashboardLayout title="Espace Patient" navItems={patientNav} />}>
                <Route path="patient/dashboard" element={<Lazy><PatientDashboard /></Lazy>} />
                <Route path="patient/medecins" element={<Lazy><DoctorsSearchPage /></Lazy>} />
                <Route path="patient/medecins/:id" element={<Lazy><DoctorDetailPage /></Lazy>} />
                <Route path="patient/rendez-vous" element={<Lazy><AppointmentsPage /></Lazy>} />
                <Route path="patient/laboratoires" element={<Lazy><LaboratoriesPage /></Lazy>} />
                <Route path="patient/carte" element={<Lazy><MapPage /></Lazy>} />
                <Route path="patient/messages" element={<Lazy><MessagesPage /></Lazy>} />
                <Route path="patient/parametres" element={<Lazy><ProfilePage /></Lazy>} />
                <Route path="patient/profil" element={<Navigate to="/patient/parametres" replace />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['ASSISTANT']} />}>
              <Route element={<DashboardLayout title="Espace Assistant" navItems={assistantNav} />}>
                <Route path="assistant/dashboard" element={<Lazy><AssistantDashboard /></Lazy>} />
                <Route path="assistant/mon-medecin" element={<Lazy><MyDoctorPage /></Lazy>} />
                <Route path="assistant/planning" element={<Lazy><PlanningPage /></Lazy>} />
                <Route path="assistant/demandes" element={<Lazy><RequestsPage /></Lazy>} />
                <Route path="assistant/horaires" element={<Lazy><SchedulesPage /></Lazy>} />
                <Route path="assistant/messages" element={<Lazy><MessagesPage /></Lazy>} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route element={<AdminLayout />}>
                <Route path="admin/dashboard" element={<Lazy><AdminDashboard /></Lazy>} />
                <Route path="admin/medecins" element={<Lazy><AdminManagementPage section="doctors" /></Lazy>} />
                <Route path="admin/patients" element={<Lazy><AdminManagementPage section="patients" /></Lazy>} />
                <Route path="admin/cabinets" element={<Lazy><AdminManagementPage section="cabinets" /></Lazy>} />
                <Route path="admin/laboratoires" element={<Lazy><AdminManagementPage section="laboratoires" /></Lazy>} />
                <Route path="admin/assistants" element={<Lazy><AdminManagementPage section="assistants" /></Lazy>} />
                <Route path="admin/rendez-vous" element={<Lazy><AdminManagementPage section="appointments" /></Lazy>} />
                <Route path="admin/parametres" element={<Lazy><AdminSettingsPage /></Lazy>} />
                <Route path="admin/gestion" element={<Navigate to="/admin/patients" replace />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
              <Route element={<AdminLayout />}>
                <Route path="admin/dashboard" element={<Lazy><AdminDashboard /></Lazy>} />
                <Route path="admin/medecins" element={<Lazy><AdminManagementPage section="doctors" /></Lazy>} />
                <Route path="admin/patients" element={<Lazy><AdminManagementPage section="patients" /></Lazy>} />
                <Route path="admin/cabinets" element={<Lazy><AdminManagementPage section="cabinets" /></Lazy>} />
                <Route path="admin/laboratoires" element={<Lazy><AdminManagementPage section="laboratoires" /></Lazy>} />
                <Route path="admin/assistants" element={<Lazy><AdminManagementPage section="assistants" /></Lazy>} />
                <Route path="admin/rendez-vous" element={<Lazy><AdminManagementPage section="appointments" /></Lazy>} />
                <Route path="admin/parametres" element={<Lazy><AdminSettingsPage /></Lazy>} />
                <Route path="super-admin/dashboard" element={<Lazy><SuperAdminDashboard /></Lazy>} />
                <Route path="super-admin/admins" element={<Lazy><AdminManagementPage section="admins" /></Lazy>} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
