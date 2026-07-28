import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { db } from '../services/authService'; 
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  ClipboardList, 
  PenTool, 
  Calendar, 
  Trash2, 
  Edit3, 
  Lock, 
  Unlock, 
  FileText, 
  Loader2, 
  Stethoscope,
  X 
} from 'lucide-react';



export default function DoctorPage() {
  const { currentUser } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [mySlots, setMySlots] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);

  // حقول إضافة موعد متاح جديد
  const [department, setDepartment] = useState('الطب العام');
  const [doctorName, setDoctorName] = useState(currentUser?.email ? currentUser.email.split('@')[0] : '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // حقول إضافة منشور توعوي جديد
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postDepartment, setPostDepartment] = useState('الطب العام');
  const [postDoctorName, setPostDoctorName] = useState(currentUser?.email ? currentUser.email.split('@')[0] : '');

  // حالات نافذة التعديل المنبثقة (Modals) للمواعيد والمنشورات
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);
  const [currentEditingSlot, setCurrentEditingSlot] = useState<any>(null);
  const [editSlotDept, setEditSlotDept] = useState('');
  const [editSlotDocName, setEditSlotDocName] = useState('');
  const [editSlotDate, setEditSlotDate] = useState('');
  const [editSlotTime, setEditSlotTime] = useState('');
  const [loadingEditSlot, setLoadingEditSlot] = useState(false);

  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [currentEditingPost, setCurrentEditingPost] = useState<any>(null);
  const [editPostTitle, setEditPostTitle] = useState('');
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostDepartment, setEditPostDepartment] = useState('');
  const [editPostDoctorName, setEditPostDoctorName] = useState('');
  const [loadingEditPost, setLoadingEditPost] = useState(false);

  // حالات نافذة صفحة "التقرير الطبي" المنبثقة المستقلة مع الـ Spinner
  const [isReportPageModalOpen, setIsReportPageModalOpen] = useState(false);
  const [selectedReportApp, setSelectedReportApp] = useState<any>(null);
  const [medicalDiagnosis, setMedicalDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loadingReportPage, setLoadingReportPage] = useState(false);

  // حالات الـ Spinners العامة والأزرار
  const [loadingSlot, setLoadingSlot] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toggleStatusLoadingId, setToggleStatusLoadingId] = useState<string | null>(null);
  const [postActionLoadingId, setPostActionLoadingId] = useState<string | null>(null);
  const [appointmentActionId, setAppointmentActionId] = useState<string | null>(null);

  const [message, setMessage] = useState('');

  const fetchDoctorData = async () => {
    if (!currentUser) return;
    try {
      const slotsQuery = query(collection(db, 'availableSlots'), where('doctorEmail', '==', currentUser.email));
      const slotsSnap = await getDocs(slotsQuery);
      setMySlots(slotsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const postsQuery = query(collection(db, 'posts'), where('authorEmail', '==', currentUser.email));
      const postsSnap = await getDocs(postsQuery);
      setMyPosts(postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const appointmentsSnap = await getDocs(collection(db, 'appointments'));
      setAppointments(appointmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('خطأ في جلب بيانات الطبيب:', error);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [currentUser]);

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoadingSlot(true);
    try {
      await addDoc(collection(db, 'availableSlots'), {
        department,
        doctorName: doctorName || currentUser.email,
        doctorEmail: currentUser.email,
        date,
        time,
        isAvailable: true,
        createdAt: serverTimestamp()
      });
      setMessage('تم إضافة الموعد بنجاح وجدوله للمرضى!');
      setDate('');
      setTime('');
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ:', error);
      setMessage('حدث خطأ أثناء حفظ الموعد.');
    } finally {
      setLoadingSlot(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleOpenEditSlot = (slot: any) => {
    setCurrentEditingSlot(slot);
    setEditSlotDept(slot.department || 'الطب العام');
    setEditSlotDocName(slot.doctorName || '');
    setEditSlotDate(slot.date || '');
    setEditSlotTime(slot.time || '');
    setIsEditSlotModalOpen(true);
  };

  const handleUpdateSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditingSlot) return;

    setLoadingEditSlot(true);
    try {
      await updateDoc(doc(db, 'availableSlots', currentEditingSlot.id), {
        department: editSlotDept,
        doctorName: editSlotDocName,
        date: editSlotDate,
        time: editSlotTime,
      });
      setMessage('تم تحديث الموعد بنجاح!');
      setIsEditSlotModalOpen(false);
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ في تحديث الموعد:', error);
      setMessage('حدث خطأ أثناء تحديث الموعد.');
    } finally {
      setLoadingEditSlot(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleToggleSlotStatus = async (slot: any) => {
    setToggleStatusLoadingId(slot.id);
    const newStatus = slot.isAvailable === false ? true : false;
    try {
      await updateDoc(doc(db, 'availableSlots', slot.id), {
        isAvailable: newStatus
      });
      setMessage(newStatus ? 'تم فتح الموعد بنجاح.' : 'تم إغلاق الموعد بنجاح.');
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ في تغيير حالة الموعد:', error);
      setMessage('حدث خطأ أثناء تحديث حالة الموعد.');
    } finally {
      setToggleStatusLoadingId(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    setActionLoadingId(id);
    try {
      await deleteDoc(doc(db, 'availableSlots', id));
      setMessage('تم حذف الموعد بنجاح.');
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ في الحذف:', error);
      setMessage('حدث خطأ أثناء الحذف.');
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoadingPost(true);
    const formattedAuthorName = postDoctorName || currentUser.email?.split('@')[0] || 'طبيب';
    const finalAuthorDisplay = formattedAuthorName.includes('د.') || formattedAuthorName.includes('طبيب') 
      ? formattedAuthorName 
      : `د. ${formattedAuthorName}`;

    try {
      await addDoc(collection(db, 'posts'), {
        title: postTitle,
        content: postContent,
        author: finalAuthorDisplay,
        authorEmail: currentUser.email,
        department: postDepartment,
        createdAt: new Date().toLocaleDateString('ar-SA'),
        timestamp: serverTimestamp()
      });
      setMessage('تم نشر التوجيه الطبي بنجاح بواسطة الطبيب!');
      setPostTitle('');
      setPostContent('');
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ في حفظ المنشور:', error);
      setMessage('حدث خطأ أثناء حفظ المنشور.');
    } finally {
      setLoadingPost(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleOpenEditPost = (post: any) => {
    setCurrentEditingPost(post);
    setEditPostTitle(post.title || '');
    setEditPostContent(post.content || '');
    setEditPostDepartment(post.department || 'الطب العام');
    const cleanName = post.author ? post.author.replace(/^د\.\s*/, '') : '';
    setEditPostDoctorName(cleanName);
    setIsEditPostModalOpen(true);
  };

  const handleUpdatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditingPost) return;

    setLoadingEditPost(true);
    const formattedAuthorName = editPostDoctorName || 'طبيب';
    const finalAuthorDisplay = formattedAuthorName.includes('د.') || formattedAuthorName.includes('طبيب') 
      ? formattedAuthorName 
      : `د. ${formattedAuthorName}`;

    try {
      await updateDoc(doc(db, 'posts', currentEditingPost.id), {
        title: editPostTitle,
        content: editPostContent,
        department: editPostDepartment,
        author: finalAuthorDisplay,
      });
      setMessage('تم تحديث المنشور التوعوي بنجاح!');
      setIsEditPostModalOpen(false);
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ في تحديث المنشور:', error);
      setMessage('حدث خطأ أثناء تحديث المنشور.');
    } finally {
      setLoadingEditPost(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeletePost = async (id: string) => {
    setPostActionLoadingId(id);
    try {
      await deleteDoc(doc(db, 'posts', id));
      setMessage('تم حذف المنشور بنجاح.');
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ في حذف المنشور:', error);
      setMessage('حدث خطأ أثناء حذف المنشور.');
    } finally {
      setPostActionLoadingId(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string, actionType: string) => {
    setAppointmentActionId(`${appointmentId}-${actionType}`);
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: newStatus
      });
      setMessage(newStatus === 'مؤكد' ? 'تم تأكيد حجز المريض بنجاح.' : 'تم رفض الحجز.');
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ في تحديث حالة الحجز:', error);
      setMessage('حدث خطأ أثناء تحديث الحالة.');
    } finally {
      setAppointmentActionId(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleOpenReportPageModal = (appointment: any) => {
    setSelectedReportApp(appointment);
    setMedicalDiagnosis(appointment.medicalDiagnosis || appointment.doctorReport || '');
    setPrescription(appointment.prescription || '');
    setDoctorNotes(appointment.doctorNotes || '');
    setIsReportPageModalOpen(true);
  };

  const handleSaveReportPageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportApp) return;

    setLoadingReportPage(true);
    const combinedReportText = `التشخيص: ${medicalDiagnosis} | العلاج: ${prescription} | ملاحظات: ${doctorNotes}`;
    try {
      await updateDoc(doc(db, 'appointments', selectedReportApp.id), {
        medicalDiagnosis,
        prescription,
        doctorNotes,
        doctorReport: combinedReportText,
        reportUpdatedAt: serverTimestamp()
      });
      setMessage('تم إصدار واعتماد "التقرير الطبي" بنجاح للمريض!');
      setIsReportPageModalOpen(false);
      fetchDoctorData();
    } catch (error) {
      console.error('خطأ في حفظ التقرير الطبي:', error);
      setMessage('حدث خطأ أثناء إصدار التقرير الطبي.');
    } finally {
      setLoadingReportPage(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Cairo']" dir="rtl">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">لوحة التحكم الطبية - {doctorName || currentUser?.email}</h1>
              <p className="text-emerald-100 text-sm mt-1">مرحباً بك دكتور، يمكنك من هنا إدارة مواعيدك، تأكيد أو رفض حجوزات المرضى، ونشر التوجيهات الطبية وإصدار التقارير الطبية المنفصلة.</p>
            </div>
          </div>
        </div>

        {/* قسم تقرير الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4 space-x-reverse">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">عدد الحجوزات الكلي</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{appointments.length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4 space-x-reverse">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PenTool className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">عدد المناشير المضافة</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{myPosts.length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4 space-x-reverse">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold">عدد المواعيد المتاحة</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{mySlots.length}</h3>
            </div>
          </div>
        </div>

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl mb-6 text-sm font-bold text-center animate-pulse">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* قسم إضافة موعد جديد */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">إضافة موعد جديد متاح للحجز</h2>
            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">القسم الطبي</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none">
                  <option value="الطب العام">الطب العام</option>
                  <option value="البطنية">البطنية</option>
                  <option value="الأطفال">الأطفال</option>
                  <option value="النساء والتوليد">النساء والتوليد</option>
                  <option value="العظام">العظام</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">اسم الطبيب الظاهر (سيظهر في الحجوزات)</label>
                <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="مثال: د. محمد أحمد" required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">التاريخ</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">الوقت</label>
                  <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="مثال: 10:00 صباحاً" required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loadingSlot} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-70"
              >
                {loadingSlot && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                <span>إضافة الموعد للجدول العام</span>
              </button>
            </form>
          </div>

          {/* قسم نشر التوجيهات الطبية */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">نشر توجيه أو نصيحة طبية للمرضى</h2>
            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">القسم الطبي للمنشور</label>
                <select value={postDepartment} onChange={(e) => setPostDepartment(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none">
                  <option value="الطب العام">الطب العام</option>
                  <option value="البطنية">البطنية</option>
                  <option value="الأطفال">الأطفال</option>
                  <option value="النساء والتوليد">النساء والتوليد</option>
                  <option value="العظام">العظام</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">اسم الطبيب الكاتب للمنشور</label>
                <input 
                  type="text" 
                  value={postDoctorName} 
                  onChange={(e) => setPostDoctorName(e.target.value)} 
                  placeholder="مثال: د. أحمد خالد" 
                  required 
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">عنوان المنشور أو النصيحة</label>
                <input type="text" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="مثال: نصائح للوقاية من ارتفاع الضغط" required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">محتوى النصيحة التوعوية</label>
                <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="اكتب التفاصيل الطبية والتوجيهات هنا..." rows={3} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>

              <button 
                type="submit" 
                disabled={loadingPost} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-70"
              >
                {loadingPost && <Loader2 className="animate-spin h-5 w-5 ml-2" />}
                <span>نشر النصيحة في لوحة المرضى</span>
              </button>
            </form>
          </div>
        </div>

        {/* عرض منشوراتي التوعوية */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">منشوراتي التوعوية المنشورة ({myPosts.length})</h2>
          {myPosts.length === 0 ? (
            <p className="text-xs text-slate-400">لم تقم بنشر أي توجيهات طبية بعد</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPosts.map((post) => (
                <div key={post.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{post.department || 'الطب العام'}</span>
                      <span className="text-[10px] text-slate-400">{post.createdAt}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{post.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">{post.content}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl flex items-center space-x-1 space-x-reverse">
                      <Stethoscope className="w-3.5 h-3.5 ml-1" />
                      <span>{post.author || 'طبيب'}</span>
                    </span>
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <button 
                        onClick={() => handleOpenEditPost(post)} 
                        title="تعديل المنشور"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)} 
                        disabled={postActionLoadingId === post.id}
                        title="حذف المنشور"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-50"
                      >
                        {postActionLoadingId === post.id ? (
                          <Loader2 className="animate-spin h-4 w-4 text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* مواعيدي المتاحة الحالية */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">مواعيدي المتاحة المعروضة حالياً للحجز</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mySlots.length === 0 ? (
              <p className="text-xs text-slate-400">لم تقم بإضافة أي مواعيد متاحة بعد</p>
            ) : (
              mySlots.map(slot => (
                <div key={slot.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{slot.department}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${slot.isAvailable === false ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-700'}`}>
                        {slot.isAvailable === false ? 'مغلق' : 'مفتوح'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs mt-2 flex items-center space-x-1 space-x-reverse">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 ml-1" />
                      <span>{slot.date} | ⏰ {slot.time}</span>
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 space-x-reverse">
                    <button 
                      onClick={() => handleToggleSlotStatus(slot)}
                      disabled={toggleStatusLoadingId === slot.id}
                      title={slot.isAvailable === false ? "فتح الموعد" : "إغلاق الموعد"}
                      className={`p-2 rounded-xl transition disabled:opacity-50 ${slot.isAvailable === false ? 'text-teal-600 hover:bg-teal-50' : 'text-amber-600 hover:bg-amber-50'}`}
                    >
                      {toggleStatusLoadingId === slot.id ? (
                        <Loader2 className="animate-spin h-4 w-4 text-slate-600" />
                      ) : slot.isAvailable === false ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </button>

                    <button 
                      onClick={() => handleOpenEditSlot(slot)} 
                      title="تعديل الموعد"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleDeleteSlot(slot.id)} 
                      disabled={actionLoadingId === slot.id}
                      title="حذف الموعد"
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-50"
                    >
                      {actionLoadingId === slot.id ? (
                        <Loader2 className="animate-spin h-4 w-4 text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* جدول حجوزات المرضى (مع التوافقية الكاملة لأسماء الحقول) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">جميع حجوزات المرضى ({appointments.length})</h2>
          {appointments.length === 0 ? (
            <p className="text-xs text-slate-400">لا توجد حجوزات مسجلة حالياً</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-3 font-bold">اسم المريض</th>
                    <th className="pb-3 font-bold">العمر</th>
                    <th className="pb-3 font-bold">السكن</th>
                    <th className="pb-3 font-bold">الحالة الصحية</th>
                    <th className="pb-3 font-bold">الموعد</th>
                    <th className="pb-3 font-bold">الحالة</th>
                    <th className="pb-3 font-bold">حالة التقرير الطبي</th>
                    <th className="pb-3 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appointments.map((app) => (
                    <tr key={app.id} className="text-slate-700">
                      <td className="py-3 font-bold text-slate-900">
                        {app.patientName || app.fullName || app.name || 'مريض بدون اسم'}
                      </td>
                      <td className="py-3">{app.age ? `${app.age} سنة` : 'غير محدد'}</td>
                      <td className="py-3">
                        {app.address || app.city || 'غير محدد'} {app.state || app.district ? `(${app.state || app.district})` : ''}
                      </td>
                      <td className="py-3">{app.medicalHistory || 'لا توجد ملاحظات'}</td>
                      <td className="py-3 text-blue-600 font-semibold">{app.date} | {app.time}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          app.status === 'مؤكد' ? 'bg-emerald-50 text-emerald-700' : 
                          app.status === 'مرفوض' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {app.status || 'معلق'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button 
                          onClick={() => handleOpenReportPageModal(app)}
                          title="فتح وتعديل التقرير الطبي"
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-md flex items-center space-x-1 space-x-reverse ${
                            app.doctorReport 
                              ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 ml-1" />
                          <span>{app.doctorReport ? 'تعديل التقرير الطبي' : 'إصدار التقرير الطبي'}</span>
                        </button>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                          <button
                            onClick={() => handleUpdateAppointmentStatus(app.id, 'مؤكد', 'confirm')}
                            disabled={appointmentActionId === `${app.id}-confirm`}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-bold transition disabled:opacity-50"
                          >
                            تأكيد
                          </button>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(app.id, 'مرفوض', 'reject')}
                            disabled={appointmentActionId === `${app.id}-reject`}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 font-bold transition disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* نافذة تعديل الموعد المتاح */}
      {isEditSlotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">تعديل الموعد المتاح</h3>
              <button onClick={() => setIsEditSlotModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSlotSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">القسم الطبي</label>
                <select value={editSlotDept} onChange={(e) => setEditSlotDept(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none">
                  <option value="الطب العام">الطب العام</option>
                  <option value="البطنية">البطنية</option>
                  <option value="الأطفال">الأطفال</option>
                  <option value="النساء والتوليد">النساء والتوليد</option>
                  <option value="العظام">العظام</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">اسم الطبيب</label>
                <input type="text" value={editSlotDocName} onChange={(e) => setEditSlotDocName(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">التاريخ</label>
                  <input type="date" value={editSlotDate} onChange={(e) => setEditSlotDate(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">الوقت</label>
                  <input type="text" value={editSlotTime} onChange={(e) => setEditSlotTime(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loadingEditSlot} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center">
                  {loadingEditSlot && <Loader2 className="animate-spin h-4 w-4 ml-2" />}
                  <span>حفظ التعديلات</span>
                </button>
                <button type="button" onClick={() => setIsEditSlotModalOpen(false)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تعديل المنشور */}
      {isEditPostModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">تعديل المنشور التوعوي</h3>
              <button onClick={() => setIsEditPostModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePostSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">القسم الطبي</label>
                <select value={editPostDepartment} onChange={(e) => setEditPostDepartment(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none">
                  <option value="الطب العام">الطب العام</option>
                  <option value="البطنية">البطنية</option>
                  <option value="الأطفال">الأطفال</option>
                  <option value="النساء والتوليد">النساء والتوليد</option>
                  <option value="العظام">العظام</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">اسم الطبيب</label>
                <input type="text" value={editPostDoctorName} onChange={(e) => setEditPostDoctorName(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">عنوان المنشور</label>
                <input type="text" value={editPostTitle} onChange={(e) => setEditPostTitle(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">محتوى النصيحة</label>
                <textarea value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} rows={3} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loadingEditPost} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center">
                  {loadingEditPost && <Loader2 className="animate-spin h-4 w-4 ml-2" />}
                  <span>حفظ التعديلات</span>
                </button>
                <button type="button" onClick={() => setIsEditPostModalOpen(false)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إصدار التقرير الطبي */}
      {isReportPageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                إصدار / تعديل التقرير الطبي للمريض: {selectedReportApp?.patientName || selectedReportApp?.fullName}
              </h3>
              <button onClick={() => setIsReportPageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveReportPageSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">التشخيص الطبي</label>
                <textarea value={medicalDiagnosis} onChange={(e) => setMedicalDiagnosis(e.target.value)} placeholder="أدخل التشخيص..." rows={2} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">الوصفة الطبية / العلاج</label>
                <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="أدخل الأدوية والجرعات..." rows={2} required className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">ملاحظات وتوجيهات الطبيب</label>
                <textarea value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="تعليمات إضافية للمريض..." rows={2} className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-sm focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loadingReportPage} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center">
                  {loadingReportPage && <Loader2 className="animate-spin h-4 w-4 ml-2" />}
                  <span>اعتماد وإرسال التقرير</span>
                </button>
                <button type="button" onClick={() => setIsReportPageModalOpen(false)} className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}