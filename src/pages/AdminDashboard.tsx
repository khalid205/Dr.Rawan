import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/authService'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';

function CustomNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <nav className="bg-white/85 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20 text-sm">
            Dr.Rawan
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogout}
            className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [medicalReports, setMedicalReports] = useState<any[]>([]);

  // نموذج إضافة موعد طبي جديد للأطباء
  const [doctorName, setDoctorName] = useState('');
  const [department, setDepartment] = useState('البطنية');
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');

  // نموذج نشر توعية طبية جديدة
  const [postTitle, setPostTitle] = useState('');
  const [postDepartment, setPostDepartment] = useState('البطنية');
  const [postContent, setPostContent] = useState('');

  // نموذج إضافة تقرير طبي من الإدارة
  const [reportTitle, setReportTitle] = useState('');
  const [reportPatientEmail, setReportPatientEmail] = useState('');
  const [reportContent, setReportContent] = useState('');

  // حالات تعديل المنشورات
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostDepartment, setEditPostDepartment] = useState('البطنية');
  const [editPostContent, setEditPostContent] = useState('');

  // حالات تعديل التقرير الطبي
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [editReportTitle, setEditReportTitle] = useState('');
  const [editReportPatientEmail, setEditReportPatientEmail] = useState('');
  const [editReportContent, setEditReportContent] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const [updatingSlotId, setUpdatingSlotId] = useState<string | null>(null);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'appointment' | 'slot' | 'post' | 'report'; id: string } | null>(null);

  const fetchAdminData = async () => {
    try {
      const appSnapshot = await getDocs(collection(db, 'appointments'));
      setAppointments(appSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const slotsSnapshot = await getDocs(collection(db, 'availableSlots'));
      setAvailableSlots(slotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const postsSnapshot = await getDocs(collection(db, 'posts'));
      setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const reportsSnapshot = await getDocs(collection(db, 'medicalReports'));
      setMedicalReports(reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('خطأ في جلب بيانات لوحة التحكم:', error);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('جاري إضافة الموعد الطبي الجديد...');
    setShowStatusModal(true);

    try {
      await addDoc(collection(db, 'availableSlots'), {
        doctorName,
        department,
        date: slotDate,
        time: slotTime,
        isAvailable: true,
        createdAt: serverTimestamp()
      });

      setStatusMessage('تم إضافة الموعد بنجاح وأصبح متاحاً للمرضى!');
      setDoctorName('');
      setSlotDate('');
      setSlotTime('');
      fetchAdminData();
    } catch (error) {
      console.error(error);
      setStatusMessage('حدث خطأ أثناء إضافة الموعد.');
    } finally {
      setLoading(false);
      setTimeout(() => setShowStatusModal(false), 2000);
    }
  };

  const handleToggleSlotAvailability = async (slotId: string, currentStatus: boolean) => {
    setUpdatingSlotId(slotId);
    try {
      const docRef = doc(db, 'availableSlots', slotId);
      await updateDoc(docRef, { isAvailable: !currentStatus });
      fetchAdminData();
    } catch (error) {
      console.error('خطأ في تحديث حالة التوافر:', error);
    } finally {
      setUpdatingSlotId(null);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !postTitle.trim()) return;

    setLoading(true);
    setStatusMessage('جاري نشر المنشور...');
    setShowStatusModal(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'posts'), {
        title: postTitle,
        department: postDepartment,
        content: postContent,
        createdAt: today,
        author: 'Dr.Rawan'
      });

      setStatusMessage('تم نشر المنشور بنجاح!');
      setPostTitle('');
      setPostDepartment('البطنية');
      setPostContent('');
      fetchAdminData();
    } catch (error) {
      console.error(error);
      setStatusMessage('حدث خطأ أثناء نشر المنشور.');
    } finally {
      setLoading(false);
      setTimeout(() => setShowStatusModal(false), 2000);
    }
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportContent.trim() || !reportTitle.trim()) return;

    setLoading(true);
    setStatusMessage('جاري إصدار التقرير الطبي...');
    setShowStatusModal(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'medicalReports'), {
        title: reportTitle,
        patientEmail: reportPatientEmail.trim() || 'عام / للجميع',
        content: reportContent,
        createdAt: today,
        author: 'Dr.Rawan'
      });

      setStatusMessage('تم إصدار التقرير الطبي بنجاح!');
      setReportTitle('');
      setReportPatientEmail('');
      setReportContent('');
      fetchAdminData();
    } catch (error) {
      console.error(error);
      setStatusMessage('حدث خطأ أثناء إصدار التقرير.');
    } finally {
      setLoading(false);
      setTimeout(() => setShowStatusModal(false), 2000);
    }
  };

  const handleOpenEditPost = (post: any) => {
    setEditingPost(post);
    setEditPostTitle(post.title || '');
    setEditPostDepartment(post.department || 'البطنية');
    setEditPostContent(post.content || '');
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    setLoading(true);
    setStatusMessage('جاري تحديث المنشور...');
    setShowStatusModal(true);

    try {
      const docRef = doc(db, 'posts', editingPost.id);
      await updateDoc(docRef, {
        title: editPostTitle,
        department: editPostDepartment,
        content: editPostContent
      });

      setStatusMessage('تم تحديث المنشور بنجاح!');
      setEditingPost(null);
      fetchAdminData();
    } catch (error) {
      console.error('خطأ في تحديث المنشور:', error);
      setStatusMessage('حدث خطأ أثناء التحديث.');
    } finally {
      setLoading(false);
      setTimeout(() => setShowStatusModal(false), 2000);
    }
  };

  const handleOpenEditReport = (report: any) => {
    setEditingReport(report);
    setEditReportTitle(report.title || '');
    setEditReportPatientEmail(report.patientEmail || '');
    setEditReportContent(report.content || '');
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    setLoading(true);
    setStatusMessage('جاري تحديث التقرير الطبي...');
    setShowStatusModal(true);

    try {
      const docRef = doc(db, 'medicalReports', editingReport.id);
      await updateDoc(docRef, {
        title: editReportTitle,
        patientEmail: editReportPatientEmail,
        content: editReportContent
      });

      setStatusMessage('تم تحديث التقرير الطبي بنجاح!');
      setEditingReport(null);
      fetchAdminData();
    } catch (error) {
      console.error('خطأ في تحديث التقرير:', error);
      setStatusMessage('حدث خطأ أثناء التحديث.');
    } finally {
      setLoading(false);
      setTimeout(() => setShowStatusModal(false), 2000);
    }
  };

  const handleToggleAppointmentStatus = async (appointmentId: string, currentStatus: string) => {
    setUpdatingAppointmentId(appointmentId);
    const newStatus = currentStatus === 'مؤكد' ? 'قيد الانتظار' : 'مؤكد';
    try {
      const docRef = doc(db, 'appointments', appointmentId);
      await updateDoc(docRef, { status: newStatus });
      fetchAdminData();
    } catch (error) {
      console.error('خطأ في تحديث حالة الموعد:', error);
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const collectionName = 
        deleteTarget.type === 'appointment' ? 'appointments' :
        deleteTarget.type === 'slot' ? 'availableSlots' : 
        deleteTarget.type === 'post' ? 'posts' : 'medicalReports';

      await deleteDoc(doc(db, collectionName, deleteTarget.id));
      setDeleteTarget(null);
      fetchAdminData();
    } catch (error) {
      console.error('خطأ أثناء الحذف:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Cairo']" dir="rtl">
      <CustomNavbar />

      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-slate-100">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-700 font-bold text-sm">{statusMessage}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">✓</div>
                <p className="text-slate-900 font-bold text-sm">{statusMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-lg w-full border border-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">تعديل المنشور التوعوي</h3>
              <button onClick={() => setEditingPost(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
            </div>
            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">عنوان المنشور</label>
                <input 
                  type="text" 
                  value={editPostTitle} 
                  onChange={(e) => setEditPostTitle(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">القسم الطبي</label>
                <select 
                  value={editPostDepartment} 
                  onChange={(e) => setEditPostDepartment(e.target.value)} 
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="البطنية">قسم الباطنية</option>
                  <option value="الأطفال">قسم الأطفال</option>
                  <option value="النساء والتوليد">قسم النساء والتوليد</option>
                  <option value="الأسنان">قسم الأسنان</option>
                  <option value="القلب">قسم القلب</option>
                  <option value="عام">توعية عامة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">محتوى المنشور</label>
                <textarea 
                  value={editPostContent} 
                  onChange={(e) => setEditPostContent(e.target.value)} 
                  rows={4} 
                  required 
                  className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:border-blue-500 resize-none" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingPost(null)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-xs hover:bg-slate-200 transition">إلغاء</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/20 transition">حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-lg w-full border border-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">تعديل التقرير الطبي من الإدارة</h3>
              <button onClick={() => setEditingReport(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
            </div>
            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">عنوان التقرير</label>
                <input 
                  type="text" 
                  value={editReportTitle} 
                  onChange={(e) => setEditReportTitle(e.target.value)} 
                  required 
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">بريد المريض (اختياري)</label>
                <input 
                  type="email" 
                  value={editReportPatientEmail} 
                  onChange={(e) => setEditReportPatientEmail(e.target.value)} 
                  placeholder="اتركه فارغاً ليظهر للجميع" 
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">محتوى التقرير الطبي</label>
                <textarea 
                  value={editReportContent} 
                  onChange={(e) => setEditReportContent(e.target.value)} 
                  rows={4} 
                  required 
                  className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:border-blue-500 resize-none" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingReport(null)} className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-xs hover:bg-slate-200 transition">إلغاء</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition">حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2">تأكيد الحذف</h3>
            <p className="text-xs text-slate-600 mb-6">هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً؟</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-2xl font-bold text-xs">إلغاء</button>
              <button onClick={confirmDelete} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-rose-600/20">حذف نهائي</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-400/30">لوحة تحكم المشرف (Admin)</span>
              <h1 className="text-2xl sm:text-3xl font-black mt-3">أهلاً بك، لوحة التحكم الرئيسية</h1>
              <p className="text-slate-300 text-sm mt-1">إدارة الحجوزات، حالة الأطباء، والنشرات التوعوية الخاصة بالمنظومة.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center min-w-[100px]">
                <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/20 text-blue-300 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="block text-xl font-black">{appointments.length}</span>
                <span className="text-[11px] text-slate-300 font-medium">حجوزات المرضى</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center min-w-[100px]">
                <div className="w-8 h-8 mx-auto mb-2 bg-emerald-500/20 text-emerald-300 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="block text-xl font-black">{availableSlots.length}</span>
                <span className="text-[11px] text-slate-300 font-medium">الأطباء المسجلين</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center min-w-[100px]">
                <div className="w-8 h-8 mx-auto mb-2 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <span className="block text-xl font-black">{posts.length}</span>
                <span className="text-[11px] text-slate-300 font-medium">المناشير المنشورة</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">إضافة جدول وموعد طبي جديد</h2>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">اسم الطبيب</label>
                <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="مثال: د. أحمد محمد" required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">التخصص / القسم</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none">
                  <option value="البطنية">قسم الباطنية</option>
                  <option value="الأطفال">قسم الأطفال</option>
                  <option value="النساء والتوليد">قسم النساء والتوليد</option>
                  <option value="الأسنان">قسم الأسنان</option>
                  <option value="القلب">قسم القلب</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">التاريخ</label>
                  <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">الوقت</label>
                  <input type="time" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-blue-600/20 mt-2">
                إضافة الموعد لقائمة الأطباء
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">إنشاء منشور توعوي جديد</h2>
            <form onSubmit={handleAddPost} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                    Dr
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Dr.Rawan</h4>
                    <span className="text-[10px] text-slate-400">النشر للعامة والمرضى</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">عنوان المنشور</label>
                  <input 
                    type="text" 
                    value={postTitle} 
                    onChange={(e) => setPostTitle(e.target.value)} 
                    placeholder="مثال: أهمية الكشف المبكر عن الضغط" 
                    required 
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">القسم الطبي</label>
                  <select 
                    value={postDepartment} 
                    onChange={(e) => setPostDepartment(e.target.value)} 
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="البطنية">قسم الباطنية</option>
                    <option value="الأطفال">قسم الأطفال</option>
                    <option value="النساء والتوليد">قسم النساء والتوليد</option>
                    <option value="الأسنان">قسم الأسنان</option>
                    <option value="القلب">قسم القلب</option>
                    <option value="عام">توعية عامة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">محتوى المنشور</label>
                  <textarea 
                    value={postContent} 
                    onChange={(e) => setPostContent(e.target.value)} 
                    placeholder="بما تفكر في توجيهه للمرضى اليوم؟..." 
                    rows={4} 
                    required 
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-500 resize-none" 
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>نشر المنشور</span>
              </button>
            </form>
          </div>
        </div>

        {/* قسمي إدارة جداول الأطباء وموجز المنشورات النشطة (تم نقلهما ليصبا أعلى قسم التقارير) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">إدارة جداول الأطباء (فتح / إغلاق الحجز)</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pl-1">
              {availableSlots.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد مواعيد مضافة حالياً</p>
              ) : (
                availableSlots.map(slot => {
                  const isAvailable = slot.isAvailable !== false;
                  const isUpdating = updatingSlotId === slot.id;

                  return (
                    <div key={slot.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{slot.department}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {isAvailable ? '🟢 متاح للحجز' : '🔴 مغلق'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mt-1.5">{slot.doctorName}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">📅 {slot.date} | ⏰ {slot.time}</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => handleToggleSlotAvailability(slot.id, isAvailable)}
                          disabled={isUpdating}
                          title={isAvailable ? 'إغلاق الحجز' : 'فتح الحجز'}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition shadow-sm disabled:opacity-50 ${isAvailable ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                        >
                          {isUpdating ? (
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : isAvailable ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>

                        <button 
                          onClick={() => setDeleteTarget({ type: 'slot', id: slot.id })} 
                          title="حذف الموعد"
                          className="w-9 h-9 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">موجز المنشورات النشطة (Feed)</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pl-1">
              {posts.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد منشورات حتى الآن</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                          Dr
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-xs">{post.author || 'Dr.Rawan'}</h4>
                            {post.department && (
                              <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{post.department}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{post.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEditPost(post)} 
                          title="تعديل المنشور"
                          className="w-8 h-8 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setDeleteTarget({ type: 'post', id: post.id })} 
                          title="حذف المنشور"
                          className="w-8 h-8 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {post.title && (
                      <h3 className="font-bold text-slate-900 text-xs mb-1.5">{post.title}</h3>
                    )}
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* قسم إصدار التقرير الطبي */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">إصدار تقرير طبي من الإدارة (يظهر في صفحة المستخدم)</h2>
          <form onSubmit={handleAddReport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">عنوان التقرير</label>
                <input 
                  type="text" 
                  value={reportTitle} 
                  onChange={(e) => setReportTitle(e.target.value)} 
                  placeholder="مثال: التقرير الطبي الشامل للحالة" 
                  required 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">بريد المريض (اختياري)</label>
                <input 
                  type="email" 
                  value={reportPatientEmail} 
                  onChange={(e) => setReportPatientEmail(e.target.value)} 
                  placeholder="اتركه فارغاً ليظهر للعامة" 
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500" 
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">تفاصيل ومحتوى التقرير الطبي</label>
              <textarea 
                value={reportContent} 
                onChange={(e) => setReportContent(e.target.value)} 
                placeholder="اكتب تفاصيل التشخيص والعلاج والتعليمات هنا..." 
                rows={3} 
                required 
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-emerald-500 resize-none" 
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>إصدار ونشر التقرير الطبي</span>
            </button>
          </form>
        </div>

        {/* قسم عرض التقارير الطبية النشطة (مباشرة تحت نموذج الإصدار) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">إدارة التقارير الطبية الصادرة للشفاء والمتابعة</h2>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl">{medicalReports.length} تقرير</span>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pl-1">
            {medicalReports.length === 0 ? (
              <p className="text-xs text-slate-400">لا توجد تقارير طبية صادرة حتى الآن</p>
            ) : (
              medicalReports.map(report => (
                <div key={report.id} className="bg-emerald-50/40 border border-emerald-200/60 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                        Rx
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs">{report.title}</h4>
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">مرسل إلى: {report.patientEmail}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{report.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEditReport(report)} 
                        title="تعديل التقرير"
                        className="w-8 h-8 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setDeleteTarget({ type: 'report', id: report.id })} 
                        title="حذف التقرير"
                        className="w-8 h-8 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{report.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">سجل حجوزات المرضى الواردة</h2>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">{appointments.length} حجز</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                  <th className="pb-3 font-bold">المريض (البريد والاسم)</th>
                  <th className="pb-3 font-bold">التفاصيل الشخصية (العمر، السكن)</th>
                  <th className="pb-3 font-bold">الطبيب والموعد</th>
                  <th className="pb-3 font-bold">الحالة الصحية السابقة</th>
                  <th className="pb-3 font-bold">الحالة</th>
                  <th className="pb-3 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">لا توجد حجوزات واردة حتى الآن</td>
                  </tr>
                ) : (
                  appointments.map(app => {
                    const isConfirmed = app.status === 'مؤكد';
                    const isAppointmentUpdating = updatingAppointmentId === app.id;

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4">
                          <span className="font-bold text-slate-900 block">{app.fullName || app.patientName || 'بدون اسم'}</span>
                          <span className="text-[11px] text-blue-600">{app.patientEmail || app.email || 'غير متوفر'}</span>
                        </td>

                        <td className="py-4 text-slate-600">
                          <span className="block">العمر: {app.age || 'غير محدد'}</span>
                          <span className="text-[11px] text-slate-400">السكن: {app.location || app.address || 'غير محدد'}</span>
                        </td>

                        <td className="py-4">
                          <span className="font-bold text-slate-800 block">{app.doctorName || 'طبيب عام'}</span>
                          <span className="text-[11px] text-slate-500">📅 {app.date || app.slotDate} | ⏰ {app.time || app.slotTime}</span>
                        </td>

                        <td className="py-4 text-slate-600 max-w-xs truncate" title={app.medicalHistory || app.previousCondition || 'لا توجد تفاصيل'}>
                          {app.medicalHistory || app.previousCondition || 'لا توجد تفاصيل'}
                        </td>

                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {app.status || 'قيد الانتظار'}
                          </span>
                        </td>

                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleToggleAppointmentStatus(app.id, app.status || 'قيد الانتظار')}
                              disabled={isAppointmentUpdating}
                              title={isConfirmed ? 'التحويل إلى قيد الانتظار' : 'تأكيد الحجز'}
                              className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition shadow-sm ${isConfirmed ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                            >
                              {isAppointmentUpdating ? 'جاري...' : (isConfirmed ? 'إلغاء التأكيد' : 'تأكيد')}
                            </button>

                            <button 
                              onClick={() => setDeleteTarget({ type: 'appointment', id: app.id })}
                              title="حذف الحجز"
                              className="w-8 h-8 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}