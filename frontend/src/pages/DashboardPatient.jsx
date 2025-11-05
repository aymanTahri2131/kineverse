import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, XCircle, Edit, TrendingUp, CheckCircle, AlertTriangle, Plus, Download, FileText } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useAppointmentStore from '../store/appointmentStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format, isFuture, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function DashboardPatient() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { appointments, fetchUserAppointments, cancelAppointment, isLoading } = useAppointmentStore();
  const [filter, setFilter] = useState('all');
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (user?._id) {
      fetchUserAppointments(user._id);
    }
  }, [user]);

  const handleCancel = async (id) => {
    // Find the appointment to check if it can be cancelled
    const appointment = appointments.find(apt => apt._id === id);
    
    // Apply 48h restriction only for confirmed appointments
    // Pending appointments can always be cancelled
    if (appointment && appointment.status !== 'pending' && !canModify(appointment.date)) {
      toast.error(currentLang === 'ar' 
        ? 'لا يمكن إلغاء الموعد المؤكد قبل أقل من 48 ساعة' 
        : 'Impossible d\'annuler un rendez-vous confirmé à moins de 48h'
      );
      return;
    }

    if (!window.confirm(currentLang === 'ar' 
      ? 'هل أنت متأكد من إلغاء هذا الموعد؟' 
      : 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?'
    )) {
      return;
    }

    try {
      await cancelAppointment(id, 'Annulé par le patient');
      toast.success(currentLang === 'ar' ? 'تم إلغاء الموعد' : 'Rendez-vous annulé');
    } catch (error) {
      toast.error(currentLang === 'ar' ? 'خطأ في الإلغاء' : 'Erreur lors de l\'annulation');
    }
  };

  const canModify = (appointmentDate) => {
    const now = new Date();
    const aptDate = new Date(appointmentDate);
    const hoursUntil = (aptDate - now) / (1000 * 60 * 60);
    return hoursUntil >= 48;
  };

  const handleOpenEditModal = (appointment) => {
    setEditingAppointment(appointment);
    const appointmentDate = new Date(appointment.date);
    setEditDate(format(appointmentDate, 'yyyy-MM-dd'));
    setEditTime(format(appointmentDate, 'HH:mm'));
    setEditNotes(appointment.notes || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAppointment(null);
    setEditDate('');
    setEditTime('');
    setEditNotes('');
  };

  const handleSaveEdit = async () => {
    if (!editDate || !editTime) {
      toast.error(currentLang === 'ar' ? 'يرجى إدخال التاريخ والوقت' : 'Veuillez saisir la date et l\'heure');
      return;
    }

    try {
      // Combine date and time in local timezone
      const [hours, minutes] = editTime.split(':');
      const combinedDateTime = new Date(editDate);
      combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      // Check if new date is at least 48h in the future
      const now = new Date();
      const hoursUntil = (combinedDateTime - now) / (1000 * 60 * 60);
      if (hoursUntil < 48) {
        toast.error(currentLang === 'ar' 
          ? 'يجب أن يكون الموعد الجديد على الأقل 48 ساعة في المستقبل' 
          : 'Le nouveau rendez-vous doit être au moins 48h dans le futur'
        );
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments/${editingAppointment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date: combinedDateTime.toISOString(),
          notes: editNotes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success(currentLang === 'ar' 
        ? 'تم تحديث الموعد بنجاح' 
        : 'Rendez-vous mis à jour avec succès'
      );
      
      handleCloseEditModal();
      fetchUserAppointments(user._id);
    } catch (error) {
      toast.error(error.message || (currentLang === 'ar' 
        ? 'خطأ في تحديث الموعد' 
        : 'Erreur lors de la mise à jour du rendez-vous'
      ));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-pending',
      confirmed: 'badge badge-confirmed',
      awaiting_reconfirmation: 'badge badge-pending',
      done: 'badge badge-done',
      cancelled: 'badge badge-cancelled',
      rejected: 'badge badge-cancelled',
    };
    
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      awaiting_reconfirmation: 'À reconfirmer',
      done: 'Terminé',
      cancelled: 'Annulé',
      rejected: 'Refusé',
    };

    return <span className={badges[status]}>{labels[status]}</span>;
  };

  // Calculate stats
  const upcomingCount = appointments.filter((a) => 
    ['pending', 'confirmed'].includes(a.status) && isFuture(new Date(a.date))
  ).length;

  const completedCount = appointments.filter((a) => a.status === 'done').length;
  
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  const nextAppointment = appointments
    .filter((a) => ['pending', 'confirmed'].includes(a.status) && isFuture(new Date(a.date)))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['pending', 'confirmed'].includes(apt.status) && isFuture(new Date(apt.date));
    if (filter === 'past') return ['done', 'cancelled', 'rejected'].includes(apt.status) || isPast(new Date(apt.date));
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {currentLang === 'ar' ? 'مواعيدي' : 'Mes Rendez-vous'}
          </h1>
          <p className="text-gray-600">
            {currentLang === 'ar' 
              ? `مرحبا ${user?.name}! إدارة مواعيد العلاج الطبيعي` 
              : `Bienvenue ${user?.name} ! Gérez vos rendez-vous de kinésithérapie.`
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
            style={{ background: 'linear-gradient(to bottom right, #e8f8f7, #c8e6e4)', borderColor: '#00acc1' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#00838f' }}>
                  {currentLang === 'ar' ? 'المواعيد القادمة' : 'À venir'}
                </p>
                <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{upcomingCount}</p>
              </div>
              <Calendar className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
            style={{ background: 'linear-gradient(to bottom right, #e8f8f7, #c8e6e4)', borderColor: '#00acc1' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#00838f' }}>
                  {currentLang === 'ar' ? 'الجلسات المكتملة' : 'Séances complétées'}
                </p>
                <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{completedCount}</p>
              </div>
              <CheckCircle className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
            style={{ background: 'linear-gradient(to bottom right, #e8f8f7, #c8e6e4)', borderColor: '#00acc1' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#00838f' }}>
                  {currentLang === 'ar' ? 'قيد الانتظار' : 'En attente'}
                </p>
                <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{pendingCount}</p>
              </div>
              <AlertTriangle className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
            </div>
          </motion.div>
        </div>

        {/* Next Appointment Highlight */}
        {nextAppointment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-gradient-to-r from-kine-600/20 to-kine-700/30 text-white mb-8"
          >
            <div className="flex items-center justify-between text-black">
              <div>
                <p className="text-sm font-medium mb-2 opacity-90">
                  {currentLang === 'ar' ? '🔔 الموعد القادم' : '🔔 Prochain rendez-vous'}
                </p>
                <h3 className="text-xl font-bold mb-2">
                  {typeof nextAppointment.service === 'object' 
                    ? nextAppointment.service[currentLang] || nextAppointment.service.fr 
                    : nextAppointment.service
                  }
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(nextAppointment.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(nextAppointment.date), 'HH:mm')}</span>
                  </div>
                </div>
              </div>
              {nextAppointment.kine && (
                <div className="text-right">
                  <p className="text-sm opacity-90 mb-1">
                    {currentLang === 'ar' ? 'المعالج' : 'Kiné'}
                  </p>
                  <p className="font-semibold">Dr. {nextAppointment.kine.name}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => navigate('/book')}
            className="btn btn-primary flex items-center space-x-2 text-lg px-8 py-3"
          >
            <Plus className="w-5 h-5" />
            <span>{currentLang === 'ar' ? 'حجز موعد جديد' : 'Nouveau rendez-vous'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {currentLang === 'ar' ? 'الكل' : 'Tous'}
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {currentLang === 'ar' ? 'القادمة' : 'À venir'}
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`btn ${filter === 'past' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {currentLang === 'ar' ? 'السابقة' : 'Passés'}
          </button>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-600 mb-4">
              {currentLang === 'ar' ? 'لا توجد مواعيد' : 'Aucun rendez-vous trouvé'}
            </p>
            <button
              onClick={() => navigate('/book')}
              className="btn btn-primary"
            >
              {currentLang === 'ar' ? 'حجز موعد' : 'Prendre un rendez-vous'}
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAppointments.map((appointment, index) => {
              const serviceName = typeof appointment.service === 'object' 
                ? appointment.service[currentLang] || appointment.service.fr 
                : appointment.service;
              
              const appointmentDate = new Date(appointment.date);
              const isUpcoming = isFuture(appointmentDate);
              
              return (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`card hover:shadow-lg transition-shadow ${
                    isUpcoming ? 'border-l-4 border-l-kine-500' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Header avec titre et statut */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {serviceName}
                          </h3>
                          {isUpcoming && (
                            <span className="inline-flex items-center text-xs font-medium text-kine-600 bg-kine-50 px-2 py-1 rounded">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {currentLang === 'ar' ? 'قادم' : 'À venir'}
                            </span>
                          )}
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>

                      {/* Informations principales */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Date et heure */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-kine-600" />
                            <span className="font-medium">
                              {format(appointmentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Clock className="w-4 h-4 text-kine-600" />
                            <span className="font-medium">{format(appointmentDate, 'HH:mm')}</span>
                          </div>
                        </div>

                        {/* Kiné */}
                        {appointment.kine && (
                          <div className="flex items-start space-x-2 text-gray-700">
                            <User className="w-4 h-4 text-kine-600 mt-0.5" />
                            <div>
                              <p className="font-medium">Dr. {appointment.kine.name}</p>
                              {appointment.kine.specialty && (
                                <p className="text-xs text-gray-500">{appointment.kine.specialty}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Note */}
                      {appointment.notes && (
                        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong className="text-gray-900">{currentLang === 'ar' ? 'ملاحظة:' : 'Note :'}</strong> {appointment.notes}
                          </p>
                        </div>
                      )}

                      {/* Ordonnance */}
                      {appointment.attachment?.url && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  {currentLang === 'ar' ? 'وصفة طبية مرفقة' : 'Ordonnance jointe'}
                                </p>
                                <p className="text-xs text-blue-600">
                                  {currentLang === 'ar' ? 'انقر لعرض' : 'Cliquez pour afficher'}
                                </p>
                              </div>
                            </div>
                            <a
                              href={appointment.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                              title={currentLang === 'ar' ? 'عرض الشهادة' : 'Voir le certificat'}
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {['pending', 'confirmed'].includes(appointment.status) && isUpcoming && (
                      <div className="flex flex-col space-y-2 min-w-[180px]">
                        {/* Always show buttons for pending appointments, or if within 48h window for confirmed */}
                        {(appointment.status === 'pending' || canModify(appointment.date)) && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(appointment)}
                              className="btn btn-outline flex items-center justify-center space-x-2 w-full"
                            >
                              <Edit className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'تعديل' : 'Modifier'}</span>
                            </button>
                            <button
                              onClick={() => handleCancel(appointment._id)}
                              className="btn btn-danger flex items-center justify-center space-x-2 w-full"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'إلغاء' : 'Annuler'}</span>
                            </button>
                          </>
                        )}
                        {/* Show restriction message only for confirmed appointments < 48h */}
                        {appointment.status === 'confirmed' && !canModify(appointment.date) && (
                          <p className="text-xs text-red-500 font-medium text-center bg-red-50 p-2 rounded">
                            {currentLang === 'ar' 
                              ? 'لا يمكن التعديل أو الإلغاء < 48 ساعة' 
                              : 'Modification et annulation impossibles < 48h'
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Appointment Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Edit className="text-kine-600" />
              {currentLang === 'ar' ? 'تعديل الموعد' : 'Modifier le rendez-vous'}
            </h3>

            <div className="space-y-4">
              {/* Service (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang === 'ar' ? 'الخدمة' : 'Service'}
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700">
                  {currentLang === 'ar' ? editingAppointment?.service?.ar : editingAppointment?.service?.fr}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang === 'ar' ? 'التاريخ *' : 'Date *'}
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  min={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kine-500 focus:border-kine-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang === 'ar' ? 'الوقت *' : 'Heure *'}
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kine-500 focus:border-kine-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentLang === 'ar' ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kine-500 focus:border-kine-500"
                  placeholder={currentLang === 'ar' ? 'أضف ملاحظات إضافية...' : 'Ajouter des notes...'}
                />
              </div>

              {/* Warning message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  {currentLang === 'ar' 
                    ? 'سيتم تغيير حالة الموعد إلى "في انتظار إعادة التأكيد" وسيحتاج إلى موافقة الطبيب المعالج.'
                    : 'Le statut du rendez-vous sera changé en "en attente de reconfirmation" et nécessitera l\'approbation du kinésithérapeute.'
                  }
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCloseEditModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-kine-600 text-white rounded-lg hover:bg-kine-700 transition-colors"
              >
                {currentLang === 'ar' ? 'حفظ التغييرات' : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
