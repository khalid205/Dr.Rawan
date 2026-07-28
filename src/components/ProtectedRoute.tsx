import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'admin' | 'user';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { currentUser, role, loading } = useAuth();

  // انتظار انتهاء فحص المصادقة لمنع الوميض أو التداخل
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // إذا لم يكن المستخدم مسجل دخول، يتم توجيهه لتسجيل الدخول
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // إذا كان دور المستخدم لا يطابق الدور المطلوب لهذا المسار، يتم توجيهه للصفحة المخصصة له
  if (role && role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin-dashboard' : '/user-page'} replace />;
  }

  return <>{children}</>;
};