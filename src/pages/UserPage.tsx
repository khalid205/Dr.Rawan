import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/authService'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'; 
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Clock, Edit3, Trash2, FileText, X, Check, Loader2, AlertTriangle, BookmarkCheck, Newspaper, Stethoscope } from 'lucide-react';

function CustomNavbar() {
  const { logout, currentUser } = useAuth();
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
            Dr.Rawan | لوحة المريض
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-bold hidden sm:inline">{currentUser?.email}</span>
          <button 
            onClick={handleLogout}
            className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function UserDashboard() {
  const { currentUser } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [medicalReports, setMedicalReports] = useState<any[]>([]);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  // حالات القائمة المنبثقة لتقرير الطبيب
  const [selectedReportText, setSelectedReportText] = useState('');
  const [selectedReportDoctor, setSelectedReportDoctor] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  // حالات نافذة التعديل للحجز
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // حالات نافذة تأكيد الحذف المنبثقة والـ Spinner
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserData = async () => {
    try {
      const slotsSnapshot = await getDocs(collection(db, 'availableSlots'));
      setAvailableSlots(slotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const postsSnapshot = await getDocs(collection(db, 'posts'));
      setPosts(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const reportsSnapshot = await getDocs(collection(db, 'medicalReports'));
      const allReports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredReports = allReports.filter(
        (r: any) => r.patientEmail === currentUser?.email || r.patientEmail === 'عام / للجميع'
      );
      setMedicalReports(filteredReports);

      const appSnapshot = await getDocs(collection(db, 'appointments'));
      const userApps = appSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((app: any) => app.patientEmail === currentUser?.email);
      setMyAppointments(userApps);

    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const handleBookSlot = async (slot: any) => {
    setLoading(true);
    setStatusMessage('جاري تأكيد حجز الموعد...');
    setShowStatusModal(true);

    try {
      await addDoc(collection(db, 'appointments'), {
        doctorName: slot.doctorName,
        department: slot.department,
        date: slot.date,
        time: slot.time,
        patientEmail: currentUser?.email,
        status: 'قيد الانتظار',
        doctorReport: '', 
        createdAt: serverTimestamp()
      });

      setStatusMessage('تم حجز الموعد بنجاح بانتظار تأكيد الإدارة!');
      fetchUserData();
    } catch (error) {
      console.error(error);
      setStatusMessage('حدث خطأ أثناء حجز الموعد.');
    } finally {
      setLoading(false);
      setTimeout(() => setShowStatusModal(false), 2000);
    }
  };

  // فتح نافذة تأكيد الحذف
  const handleOpenDeleteModal = (appId: string) => {
    setAppointmentToDelete(appId);
    setShowDeleteModal(true);
  };

  // تأكيد وتنفيد الحذف من قاعدة البيانات مع Spinner
  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'appointments', appointmentToDelete));
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      fetchUserData();
    } catch (error) {
      console.error('خطأ في حذف الحجز:', error);
      alert('حدث خطأ أثناء حذف الحجز.');
    } finally {
      setIsDeleting(false);
    }
  };

  // فتح نافذة التعديل
  const handleOpenEditModal = (app: any) => {
    setEditingAppointment(app);
    setNewDate(app.date || '');
    setNewTime(app.time || '');
    setShowEditModal(true);
  };

  // حفظ التعديل للحجز
  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    setLoading(true);
    setStatusMessage('جاري تحديث موعد الحجز...');
    setShowStatusModal(true);

    try {
      const appRef = doc(db, 'appointments', editingAppointment.id);
      await updateDoc(appRef, {
        date: newDate,
        time: newTime,
        status: 'قيد الانتظار' 
      });

      setStatusMessage('تم تحديث الحجز بنجاح!');
      setShowEditModal(false);
      fetchUserData();
    } catch (error) {
      console.error('خطأ في تحديث الحجز:', error);
      setStatusMessage('حدث خطأ أثناء التحديث.');
    } finally {
      setLoading(false);
      setTimeout(() => setShowStatusModal(false), 2000);
    }
  };

  const handleOpenReportModal = (reportText: string, doctorName: string) => {
    setSelectedReportText(reportText);
    setSelectedReportDoctor(doctorName);
    setShowReportModal(true);
  };

  // حساب الأرقام للتقرير الإحصائي
  const availableSlotsCount = availableSlots.filter((s: any) => s.isAvailable !== false).length;
  const myAppointmentsCount = myAppointments.length;
  const postsCount = posts.length;
  const medicalReportsCount = medicalReports.length;

  return (
    <div className="min-h-screen bg-slate-50 font-['Cairo']" dir="rtl">
      <CustomNavbar />

      {/* نافذة حالة الحجز العامة المنبثقة */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center border border-slate-100">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-700 font-bold text-sm">{statusMessage}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-slate-900 font-bold text-sm">{statusMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة تأكيد الحذف المنبثقة (Delete Confirmation Modal) مع Spinner */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">تأكيد إلغاء الحجز</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">هل أنت متأكد من رغبتك في حذف هذا الحجز بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.</p>
            
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <span>تأكيد الحذف</span>
                )}
              </button>
              <button 
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل الحجز المنبثقة */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">تعديل موعد الحجز</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ الجديد</label>
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوقت الجديد</label>
                <input 
                  type="text" 
                  value={newTime} 
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="مثال: 10:00 صباحاً"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  حفظ التعديلات
                </button>
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تقرير الطبيب المنبثقة (Modal) */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">تقرير طبي</span>
                <h3 className="text-base font-black text-slate-900 mt-1">الملاحظات التشخيصية من {selectedReportDoctor}</h3>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 min-h-[120px] max-h-60 overflow-y-auto mb-6">
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedReportText}</p>
            </div>

            <button 
              onClick={() => setShowReportModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-400/30">بوابة المريض</span>
              <h1 className="text-2xl sm:text-3xl font-black mt-3">أهلاً بك، لوحة المريض الشخصية</h1>
              <p className="text-slate-300 text-sm mt-1">تصفح المواعيد المتاحة للحجز، تابع تقاريرك الطبية، واطلع على النشرات التوعوية.</p>
            </div>
          </div>
        </div>

        {/* قسم تقرير إحصائيات لوحة المريض */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">حجوزاتي الطبية</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{myAppointmentsCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">مواعيد متاحة للحجز</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{availableSlotsCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">تقاريري الطبية</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{medicalReportsCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">المنشورات التوعوية</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{postsCount}</h3>
            </div>
          </div>
        </div>

        {/* قسم المواعيد المتاحة للحجز وحجوزاتي الشخصية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">الأطباء والمواعيد المتاحة للحجز</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pl-1">
              {availableSlots.filter((s: any) => s.isAvailable !== false).length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد مواعيد متاحة للحجز حالياً</p>
              ) : (
                availableSlots
                  .filter((s: any) => s.isAvailable !== false)
                  .map((slot: any) => (
                    <div key={slot.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{slot.department}</span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1.5">{slot.doctorName}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {slot.date} | <Clock className="w-3 h-3" /> {slot.time}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleBookSlot(slot)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm w-full sm:w-auto"
                      >
                        حجز الموعد
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* قسم حجوزاتي الشخصية مع نافذة التأكيد المنبثقة وزر الحذف */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">حجوزاتي الطبية وتقارير الأطباء</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pl-1">
              {myAppointments.length === 0 ? (
                <p className="text-xs text-slate-400">ليس لديك أي حجوزات سابقة</p>
              ) : (
                myAppointments.map((app: any) => (
                  <div key={app.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{app.department}</span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1.5">{app.doctorName}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {app.date} | <Clock className="w-3 h-3" /> {app.time}
                        </p>
                        <div className="mt-2">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${app.status === 'مؤكد' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {app.status || 'قيد الانتظار'}
                          </span>
                        </div>
                      </div>

                      {/* أزرار الإجراءات */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => handleOpenEditModal(app)}
                          title="تعديل الحجز"
                          className="w-9 h-9 bg-white hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl flex items-center justify-center transition border border-slate-200 shadow-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => handleOpenDeleteModal(app.id)}
                          title="حذف الحجز"
                          className="w-9 h-9 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl flex items-center justify-center transition border border-slate-200 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* زر عرض تقرير الطبيب الشرطي */}
                    {app.doctorReport && app.doctorReport.trim() !== '' && (
                      <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                        <button 
                          onClick={() => handleOpenReportModal(app.doctorReport, app.doctorName)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 w-full sm:w-auto justify-center"
                        >
                          <FileText className="w-4 h-4" />
                          <span>عرض تقرير الطبيب</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* قسم التقارير الطبية والمنشورات التوعوية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">تقاريري الطبية الشاملة</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pl-1">
              {medicalReports.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد تقارير طبية صادرة لك حالياً</p>
              ) : (
                medicalReports.map((report: any) => (
                  <div key={report.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <h4 className="font-bold text-slate-900 text-sm">{report.title}</h4>
                    <p className="text-xs text-slate-600 mt-2">{report.content}</p>
                    <span className="block text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {report.createdAt} | بواسطة: {report.author}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">المنشورات والتوعية الطبية</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pl-1">
              {posts.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد منشورات حالياً</p>
              ) : (
                posts.map((post: any) => (
                  <div key={post.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{post.department}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{post.title}</h4>
                    <p className="text-xs text-slate-600 mt-2">{post.content}</p>
                    <span className="block text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {post.createdAt} | {post.author}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}