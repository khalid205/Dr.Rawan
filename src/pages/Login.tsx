import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(email, password);
      }

      // التحقق الفوري والدقيق من البريد لتوجيهه للمكان الصحيح مباشرة
      if (email.trim().toLowerCase() === 'RawanAwad550@gmail.com'.toLowerCase()) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/user', { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setError(
        isLoginMode
          ? 'فشل تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.'
          : 'فشل إنشاء الحساب. قد يكون البريد مستخدماً مسبقاً أو كلمة المرور ضعيفة.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full border border-slate-100">
        <div className="text-center mb-8">
          {/* مربع أزرق واحد فقط وبداخله Dr.Rawan */}
          <div className="flex justify-center mb-4">
            <div className="px-4 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20 text-sm">
              Dr.Rawan
            </div>
          </div>

          <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
            {isLoginMode ? 'تسجيل الدخول للنظام' : 'إنشاء حساب جديد'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isLoginMode ? 'أدخل بياناتك للمتابعة إلى النظام الطبي' : 'قم بإنشاء حساب جديد للبدء'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="example@domain.com" 
              required 
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:border-blue-500 transition" 
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
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:border-blue-500 transition" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-2"
          >
            {loading ? 'جاري المعالجة...' : (isLoginMode ? 'تسجيل الدخول' : 'إنشاء الحساب')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            type="button"
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            {isLoginMode ? 'ليس لديك حساب؟ سجل حساب جديد الآن' : 'لديك حساب بالفعل؟ سجل دخولك من هنا'}
          </button>
        </div>
      </div>
    </div>
  );
}