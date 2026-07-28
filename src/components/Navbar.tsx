import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('فشل تسجيل الخروج', error);
    }
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/20">
            Dr
          </div>
          <div>
            <span className="font-black text-slate-900 text-base block">Dr.Rawan</span>
            <span className="text-[10px] text-blue-600 font-bold block">
              منصة الرعاية الصحية المتكاملة
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </nav>
  );
}