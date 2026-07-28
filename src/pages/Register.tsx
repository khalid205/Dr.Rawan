import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('كلمتا المرور غير متطابقتين.');
    }

    setLoading(true);

    try {
      await register(email, password);
      
      if (email.trim().toLowerCase() === 'RawanAwad550@gmail.com'.toLowerCase()) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error("Register Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم بالفعل.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً، يجب أن تكون 6 أحرف على الأقل.');
      } else {
        setError('فشل إنشاء الحساب. تأكد من صحة البيانات.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        
        {/* اللوجو الخاص بالموقع في شاشة التسجيل */}
        <div className="flex items-center justify-center gap-3 mb-8">
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

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-900">إنشاء حساب جديد</h1>
          <p className="text-xs text-slate-500 mt-1">انضم إلينا الآن وابدأ بإدارة المواعيد بكل سهولة</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5">البريد الإلكتروني</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5">كلمة المرور</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5">تأكيد كلمة المرور</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70 mt-2 cursor-pointer"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}</span>
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}