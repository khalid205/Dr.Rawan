import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../services/authService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  role: 'admin' | 'doctor' | 'user';
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<'admin' | 'doctor' | 'user'>('user');
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // تطبيع البريد الإلكتروني للمستخدم الحالي (تحويله لحروف صغيرة لضمان المطابقة الدقيقة)
      const email = user?.email?.toLowerCase() || '';

      if (user && email === 'RawanAwad550@gmail.com'.toLowerCase()) {
        setRole('admin');
      } else if (user && (
        email === 'doctor@hospital.com'.toLowerCase() || 
        email.includes('doctor')
      )) {
        // تحديد دور الطبيب والتأكد من مطابقة الإيميل بغض النظر عن الحروف الكبيرة/الصغيرة
        setRole('doctor');
      } else {
        setRole('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    role,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}