import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import UserPage from './pages/UserPage';
import AdminDashboard from './pages/AdminDashboard';
import DoctorPage from './pages/DoctorPage';

// (باقي مكونات الحماية AdminRoute, DoctorRoute, UserRoute تبقى كما هي تماماً بدون أي تغيير)

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-['Cairo']">جاري التحميل...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role === 'doctor') return <Navigate to="/doctor" replace />;
  if (role !== 'admin') return <Navigate to="/user" replace />;
  return <>{children}</>;
}

function DoctorRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-['Cairo']">جاري التحميل...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role !== 'doctor') return <Navigate to="/user" replace />;
  return <>{children}</>;
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center font-['Cairo']">جاري التحميل...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'doctor') return <Navigate to="/doctor" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/user" element={<UserRoute><UserPage /></UserRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/doctor" element={<DoctorRoute><DoctorPage /></DoctorRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}