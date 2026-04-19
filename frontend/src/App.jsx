import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Login             from './pages/Login.jsx';
import Register          from './pages/Register.jsx';
import Dashboard         from './pages/Dashboard.jsx';
import Complaints        from './pages/Complaints.jsx';
import Announcements     from './pages/Announcements.jsx';
import Services          from './pages/Services.jsx';
import AboutPune         from './pages/AboutPune.jsx';
import OfficerPage       from './pages/OfficerPage.jsx';
import AdminOfficers     from './pages/AdminOfficers.jsx';
import AdminDashboard    from './pages/AdminDashboard.jsx';
import ManageComplaints  from './pages/ManageComplaints.jsx';
import CreateAnnouncement from './pages/CreateAnnouncement.jsx';
import AdminServices     from './pages/AdminServices.jsx';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Citizen */}
      <Route path="/dashboard"    element={<ProtectedRoute role="citizen"><Dashboard /></ProtectedRoute>} />
      <Route path="/complaints"   element={<ProtectedRoute role="citizen"><Complaints /></ProtectedRoute>} />
      <Route path="/announcements" element={<ProtectedRoute role="citizen"><Announcements /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute role="citizen"><Services /></ProtectedRoute>} />
      <Route path="/officers" element={<ProtectedRoute><OfficerPage /></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/about-pune" element={<ProtectedRoute><AboutPune /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin"               element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/complaints"    element={<ProtectedRoute role="admin"><ManageComplaints /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute role="admin"><CreateAnnouncement /></ProtectedRoute>} />
      <Route path="/admin/services"      element={<ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/officers"      element={<ProtectedRoute role="admin"><AdminOfficers /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
