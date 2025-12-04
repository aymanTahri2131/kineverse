import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Check, X, DollarSign, TrendingUp, Activity, Users, AlertCircle, BarChart3, Sparkles, Mail, CheckCircle, XCircle, Download, FileText, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useAppointmentStore from '../store/appointmentStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const COLORS = ['#3B82F6', '#60A5FA', '#8B5CF6', '#A78BFA', '#00bcd4', '#2563EB', '#7C3AED', '#00838f'];

export default function DashboardKine() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { appointments, fetchUserAppointments, confirmAppointment, markPayment, takeAppointment, fetchAvailableAppointments, isLoading } = useAppointmentStore();
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'appointments' or 'available'
  const [availableAppointments, setAvailableAppointments] = useState([]);

  useEffect(() => {
    if (user?._id) {
      fetchUserAppointments(user._id);
      loadAvailableAppointments();
    }
  }, [user]);

  const loadAvailableAppointments = async () => {
    try {
      const available = await fetchAvailableAppointments();
      setAvailableAppointments(available);
    } catch (error) {
      console.error('Error loading available appointments:', error);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await confirmAppointment(id);
      toast.success('Rendez-vous confirmé');
    } catch (error) {
      toast.error('Erreur lors de la confirmation');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markPayment(id);
      toast.success('Paiement enregistré');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const handleTakeAppointment = async (id) => {
    try {
      await takeAppointment(id);
      toast.success(currentLang === 'ar' ? 'تم قبول الموعد بنجاح' : 'Rendez-vous accepté avec succès');
      await loadAvailableAppointments(); // Refresh available list
      await fetchUserAppointments(user._id); // Refresh my appointments
    } catch (error) {
      toast.error(currentLang === 'ar' ? 'خطأ في قبول الموعد' : 'Erreur lors de l\'acceptation du rendez-vous');
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

  // Calculate KPIs
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);

  const pendingCount = appointments.filter((a) =>
    ['pending', 'awaiting_reconfirmation'].includes(a.status)
  ).length;

  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'done').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  const thisWeekAppointments = appointments.filter((a) =>
    isWithinInterval(new Date(a.date), { start: thisWeekStart, end: thisWeekEnd })
  );

  const thisMonthAppointments = appointments.filter((a) =>
    isWithinInterval(new Date(a.date), { start: thisMonthStart, end: thisMonthEnd })
  );

  const paidCount = appointments.filter((a) => a.paymentStatus === 'paid').length;
  const unpaidCount = appointments.filter((a) => a.paymentStatus === 'unpaid' && a.status !== 'cancelled').length;

  // Service distribution
  const serviceStats = appointments.reduce((acc, apt) => {
    const serviceName = typeof apt.service === 'object' 
      ? apt.service[currentLang] || apt.service.fr 
      : apt.service;
    
    if (serviceName) {
      acc[serviceName] = (acc[serviceName] || 0) + 1;
    }
    return acc;
  }, {});

  const serviceChartData = Object.entries(serviceStats).map(([name, value]) => ({
    name: name.length > 30 ? name.substring(0, 30) + '...' : name,
    value
  }));

  // Weekly trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const weeklyTrendData = last7Days.map(date => {
    const dateStr = format(date, 'EEE', { locale: fr });
    const count = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    }).length;
    return { date: dateStr, appointments: count };
  });

  // Status distribution
  const statusData = [
    { name: currentLang === 'ar' ? 'قيد الانتظار' : 'En attente', value: pendingCount, color: '#ffb83d' },
    { name: currentLang === 'ar' ? 'مؤكد' : 'Confirmés', value: confirmedCount, color: '#3cc559' },
    { name: currentLang === 'ar' ? 'مكتمل' : 'Terminés', value: completedCount, color: '#5d9bff' },
    { name: currentLang === 'ar' ? 'ملغى' : 'Annulés', value: cancelledCount, color: '#ff7259' },
  ].filter(item => item.value > 0);

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['pending', 'awaiting_reconfirmation'].includes(apt.status);
    if (filter === 'confirmed') return apt.status === 'confirmed';
    if (filter === 'completed') return apt.status === 'done';
    return true;
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-2">
            <BarChart3 className="w-10 h-10" />
            <h1 className="text-4xl font-bold text-gray-900">
              {currentLang === 'ar' ? 'لوحة الإدارة' : 'Tableau de bord'}
            </h1>
          </div>
          <p className="text-gray-600">
            {currentLang === 'ar' ? `مرحبا د. ${user?.name}! إدارة المواعيد` : `Bienvenue Dr. ${user?.name} ! Gérez vos rendez-vous patients.`}
          </p>
        </div>

        {/* Enhanced KPIs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
              <AlertCircle className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
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
                  {currentLang === 'ar' ? 'هذا الأسبوع' : 'Cette semaine'}
                </p>
                <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{thisWeekAppointments.length}</p>
              </div>
              <Calendar className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
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
                  {currentLang === 'ar' ? 'هذا الشهر' : 'Ce mois'}
                </p>
                <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{thisMonthAppointments.length}</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200"
            style={{ background: 'linear-gradient(to bottom right, #e8f8f7, #c8e6e4)', borderColor: '#00acc1' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#00838f' }}>
                  {currentLang === 'ar' ? 'الإجمالي' : 'Total'}
                </p>
                <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{appointments.length}</p>
              </div>
              <Activity className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
            </div>
          </motion.div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card border border-kine-300/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-kine-600 font-medium">
                {currentLang === 'ar' ? 'الدفع' : 'Paiements'}
              </p>
              <DollarSign className="w-5 h-5 text-kine-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-green-600">{paidCount}</span>
              <span className="text-sm text-gray-500">
                {currentLang === 'ar' ? 'مدفوع' : 'payés'}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-2xl font-bold text-red-600">{unpaidCount}</span>
              <span className="text-sm text-gray-500">
                {currentLang === 'ar' ? 'غير مدفوع' : 'non payés'}
              </span>
            </div>
          </div>

          <div className="card border border-kine-300/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-kine-600 font-medium">
                {currentLang === 'ar' ? 'مؤكد' : 'Confirmés'}
              </p>
              <Check className="w-5 h-5 text-kine-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-green-600">{confirmedCount}</span>
              <span className="text-sm text-gray-500">
                {currentLang === 'ar' ? 'موعد' : 'rendez-vous'}
              </span>
            </div>
          </div>

          <div className="card border border-kine-300/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-kine-600 font-medium">
                {currentLang === 'ar' ? 'مكتمل' : 'Terminés'}
              </p>
              <Users className="w-5 h-5 text-kine-600" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-blue-600">{completedCount}</span>
              <span className="text-sm text-gray-500">
                {currentLang === 'ar' ? 'جلسة' : 'séances'}
              </span>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setViewMode('overview')}
            className={`btn ${viewMode === 'overview' ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            <span>{currentLang === 'ar' ? 'نظرة عامة' : 'Vue d\'ensemble'}</span>
          </button>
          <button
            onClick={() => setViewMode('available')}
            className={`btn ${viewMode === 'available' ? 'btn-primary' : 'btn-secondary'} relative flex items-center`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span>{currentLang === 'ar' ? 'مواعيد متاحة' : 'Rendez-vous disponibles'}</span>
            {availableAppointments.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {availableAppointments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('appointments')}
            className={`btn ${viewMode === 'appointments' ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span>{currentLang === 'ar' ? 'مواعيدي' : 'Mes Rendez-vous'}</span>
          </button>
        </div>

        {/* Charts Section - Always shown in overview */}
        {viewMode === 'overview' && appointments.length > 0 && (
          <div className="space-y-8 mb-8">
            {/* Weekly Trend */}

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Status Distribution */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentLang === 'ar' ? 'توزيع الحالات' : 'Distribution par statut'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Service Distribution */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentLang === 'ar' ? 'الخدمات الأكثر طلبا' : 'Services les plus demandés'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceChartData.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name={currentLang === 'ar' ? 'العدد' : 'Nombre'}>
                      {serviceChartData.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {currentLang === 'ar' ? 'الاتجاه الأسبوعي' : 'Tendance hebdomadaire'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="url(#colorGradientKine)" 
                    strokeWidth={3}
                    name={currentLang === 'ar' ? 'المواعيد' : 'Rendez-vous'}
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <defs>
                    <linearGradient id="colorGradientKine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        {viewMode === 'appointments' && (
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {currentLang === 'ar' ? 'الكل' : 'Tous'}
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {currentLang === 'ar' ? 'قيد الانتظار' : 'En attente'} {pendingCount > 0 && `(${pendingCount})`}
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`btn ${filter === 'confirmed' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {currentLang === 'ar' ? 'مؤكد' : 'Confirmés'}
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {currentLang === 'ar' ? 'مكتمل' : 'Terminés'}
            </button>
          </div>
        )}

        {/* Available Appointments */}
        {viewMode === 'available' && (
          <div className="space-y-6">
            <div className="card bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    {currentLang === 'ar' ? 'مواعيد متاحة للقبول' : 'Rendez-vous disponibles'}
                  </h3>
                </div>
                <button
                  onClick={loadAvailableAppointments}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  title={currentLang === 'ar' ? 'تحديث القائمة' : 'Actualiser la liste'}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {currentLang === 'ar' ? 'تحديث' : 'Actualiser'}
                  </span>
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                {currentLang === 'ar' 
                  ? 'هذه المواعيد في انتظار معالج. انقر على "قبول" لإضافتها إلى مواعيدك.' 
                  : 'Ces rendez-vous sont en attente d\'un kinésithérapeute. Cliquez sur "Accepter" pour les ajouter à votre liste.'}
              </p>
            </div>

            {availableAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-600">
                  {currentLang === 'ar' ? 'لا توجد مواعيد متاحة حاليا' : 'Aucun rendez-vous disponible actuellement'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {availableAppointments.map((appointment, index) => {
                  const patientInfo = appointment.patient || appointment.guestInfo;
                  const serviceName = typeof appointment.service === 'object' 
                    ? appointment.service[currentLang] || appointment.service.fr 
                    : appointment.service;
                  
                  return (
                    <motion.div
                      key={appointment._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="card hover:shadow-lg transition-shadow border-2 border-green-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {patientInfo.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {serviceName}
                              </p>
                              {appointment.subservice && (
                                <p className="text-xs text-gray-500 mt-1">
                                  • {appointment.subservice}
                                </p>
                              )}
                            </div>
                            <span className="badge badge-pending flex items-center space-x-1">
                              <Sparkles className="w-3 h-3" />
                              <span>{currentLang === 'ar' ? 'جديد' : 'Nouveau'}</span>
                            </span>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{patientInfo.phone}</span>
                              </div>
                              {patientInfo.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4" />
                                  <span>{patientInfo.email}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{format(new Date(appointment.date), 'HH:mm')}</span>
                                <span className="text-gray-400">•</span>
                                <span>{appointment.durationMinutes} min</span>
                              </div>
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="mt-3 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong className="text-gray-900">{currentLang === 'ar' ? 'ملاحظة:' : 'Note :'}</strong> {appointment.notes}
                              </p>
                            </div>
                          )}

                          {/* Ordonnance */}
                          {appointment.attachment?.url && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">
                                      {currentLang === 'ar' ? 'وصفة طبية' : 'Ordonnance'}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={appointment.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                                  title={currentLang === 'ar' ? 'عرض' : 'Voir'}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Accept Button */}
                        <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2 min-w-[200px]">
                          <button
                            onClick={() => handleTakeAppointment(appointment._id)}
                            className="btn bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>{currentLang === 'ar' ? 'قبول الموعد' : 'Accepter'}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Appointments List */}
        {viewMode === 'appointments' && (
          <>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl text-gray-600">
                  {currentLang === 'ar' ? 'لا توجد مواعيد' : 'Aucun rendez-vous trouvé'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredAppointments.map((appointment, index) => {
                  const patientInfo = appointment.patient || appointment.guestInfo;
                  const serviceName = typeof appointment.service === 'object' 
                    ? appointment.service[currentLang] || appointment.service.fr 
                    : appointment.service;
                  
                  return (
                    <motion.div
                      key={appointment._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="card hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {patientInfo.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {serviceName}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              {getStatusBadge(appointment.status)}
                              {appointment.paymentStatus === 'paid' ? (
                                <span className="badge bg-green-100 text-green-800 flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{currentLang === 'ar' ? 'مدفوع' : 'Payé'}</span>
                                </span>
                              ) : (
                                <span className="badge bg-red-100 text-red-800 flex items-center space-x-1">
                                  <XCircle className="w-3 h-3" />
                                  <span>{currentLang === 'ar' ? 'غير مدفوع' : 'Non payé'}</span>
                                </span>
                              )}
                            </div>
                          </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>{patientInfo.phone}</span>
                          </div>
                          {patientInfo.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{patientInfo.email}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(appointment.date), 'EEEE d MMMM yyyy', { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(appointment.date), 'HH:mm')}</span>
                            <span className="text-gray-400">•</span>
                            <span>{appointment.durationMinutes} min</span>
                          </div>
                        </div>
                      </div>

                          {appointment.notes && (
                            <div className="mt-3 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong className="text-gray-900">{currentLang === 'ar' ? 'ملاحظة:' : 'Note :'}</strong> {appointment.notes}
                              </p>
                            </div>
                          )}

                          {/* Ordonnance */}
                          {appointment.attachment?.url && (
                            <div className="mt-3 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">
                                      {currentLang === 'ar' ? 'وصفة طبية' : 'Ordonnance'}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={appointment.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                                  title={currentLang === 'ar' ? 'عرض' : 'Voir'}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2 min-w-[200px]">
                          {['pending', 'awaiting_reconfirmation'].includes(appointment.status) && (
                            <button
                              onClick={() => handleConfirm(appointment._id)}
                              className="btn btn-primary flex items-center justify-center space-x-2"
                            >
                              <Check className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'تأكيد' : 'Confirmer'}</span>
                            </button>
                          )}

                          {appointment.status === 'confirmed' && appointment.paymentStatus === 'unpaid' && (
                            <button
                              onClick={() => handleMarkPaid(appointment._id)}
                              className="btn bg-green-600 text-white hover:bg-green-700 flex items-center justify-center space-x-2"
                            >
                              <DollarSign className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'تعيين كمدفوع' : 'Marquer payé'}</span>
                            </button>
                          )}

                          {appointment.status === 'done' && appointment.paymentStatus === 'paid' && (
                            <div className="text-center text-sm text-green-600 font-medium flex items-center justify-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>{currentLang === 'ar' ? 'جلسة مكتملة ومدفوعة' : 'Séance terminée et payée'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
