import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, User, Users, Activity, DollarSign,
  TrendingUp, CheckCircle, XCircle, AlertCircle, Edit,
  Trash2, UserPlus, Search, Filter, Download, BarChart3, Shield, Zap, Award, FileText
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useAppointmentStore from '../store/appointmentStore';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../lib/axios';

const COLORS = ['#3B82F6', '#60A5FA', '#8B5CF6', '#A78BFA', '#00bcd4', '#2563EB', '#7C3AED', '#00838f'];

export default function DashboardAdmin() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { appointments, fetchUserAppointments, isLoading } = useAppointmentStore();

  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'appointments', 'users'
  const [allAppointments, setAllAppointments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [kineList, setKineList] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loadingData, setLoadingData] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'patient'
  });
  const [editUser, setEditUser] = useState({
    name: '',
    phone: '',
    role: 'patient',
    password: '' // Optional for update
  });
  const [editingDateId, setEditingDateId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      // Fetch all appointments
      const appointmentsRes = await api.get('/appointments');
      setAllAppointments(appointmentsRes.data.appointments || []);

      // Fetch all users (admin endpoint)
      const usersRes = await api.get('/users');
      setAllUsers(usersRes.data.users || []);

      // Fetch kine list
      const kineRes = await api.get('/users/kines');
      setKineList(kineRes.data.kines || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(currentLang === 'ar' ? 'خطأ في تحميل البيانات' : 'Erreur lors du chargement des données');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newUser.name || !newUser.phone || !newUser.password) {
      toast.error(currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        name: newUser.name,
        phone: newUser.phone,
        password: newUser.password,
        role: newUser.role
      });

      toast.success(currentLang === 'ar' ? 'تم إضافة المستخدم بنجاح' : 'Utilisateur ajouté avec succès');
      setShowAddUserModal(false);
      setNewUser({ name: '', phone: '', password: '', role: 'patient' });
      fetchAllData(); // Refresh user list
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(error.response?.data?.error || (currentLang === 'ar' ? 'خطأ في إضافة المستخدم' : 'Erreur lors de l\'ajout de l\'utilisateur'));
    }
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      password: '' // Leave empty, only update if provided
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editUser.name || !editUser.phone) {
      toast.error(currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const updateData = {
        name: editUser.name,
        phone: editUser.phone,
        role: editUser.role
      };

      // Only include password if it's provided
      if (editUser.password && editUser.password.length >= 6) {
        updateData.password = editUser.password;
      }

      await api.put(`/users/${selectedUser._id}`, updateData);

      toast.success(currentLang === 'ar' ? 'تم تحديث المستخدم بنجاح' : 'Utilisateur mis à jour avec succès');
      setShowEditUserModal(false);
      setSelectedUser(null);
      setEditUser({ name: '', phone: '', role: 'patient', password: '' });
      fetchAllData(); // Refresh user list
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.error || (currentLang === 'ar' ? 'خطأ في تحديث المستخدم' : 'Erreur lors de la mise à jour de l\'utilisateur'));
    }
  };

  // Calculate comprehensive stats
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);

  const totalAppointments = allAppointments.length;
  const pendingAppointments = allAppointments.filter(a => a.status === 'pending').length;
  const confirmedAppointments = allAppointments.filter(a => a.status === 'confirmed').length;
  const completedAppointments = allAppointments.filter(a => a.status === 'done').length;
  const cancelledAppointments = allAppointments.filter(a => a.status === 'cancelled').length;

  const thisWeekAppointments = allAppointments.filter(a =>
    isWithinInterval(new Date(a.date), { start: thisWeekStart, end: thisWeekEnd })
  ).length;

  const thisMonthAppointments = allAppointments.filter(a =>
    isWithinInterval(new Date(a.date), { start: thisMonthStart, end: thisMonthEnd })
  ).length;

  const totalPatients = allUsers.filter(u => u.role === 'patient').length;
  const totalKines = allUsers.filter(u => u.role === 'kine').length;
  const totalAdmins = allUsers.filter(u => u.role === 'admin').length;

  const paidAppointments = allAppointments.filter(a => a.paymentStatus === 'paid').length;
  const unpaidAppointments = allAppointments.filter(a =>
    a.paymentStatus === 'unpaid' && a.status !== 'cancelled'
  ).length;

  // Service distribution
  const serviceStats = allAppointments.reduce((acc, apt) => {
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

  // Status distribution for pie chart
  const statusData = [
    { name: currentLang === 'ar' ? 'قيد الانتظار' : 'En attente', value: pendingAppointments, color: '#ffb83d' },
    { name: currentLang === 'ar' ? 'مؤكد' : 'Confirmés', value: confirmedAppointments, color: '#3cc559' },
    { name: currentLang === 'ar' ? 'مكتمل' : 'Terminés', value: completedAppointments, color: '#5d9bff' },
    { name: currentLang === 'ar' ? 'ملغى' : 'Annulés', value: cancelledAppointments, color: '#ff7259' },
  ].filter(item => item.value > 0);

  // Last 30 days trend
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  const monthlyTrendData = last30Days.map(date => {
    const dateStr = format(date, 'dd/MM');
    const count = allAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    }).length;
    return { date: dateStr, appointments: count };
  });

  // Kine performance - Filter out null/undefined kines
  const kinePerformance = kineList
    .filter(kine => kine && kine._id && kine.name) // Safety check
    .map(kine => {
      const kineAppointments = allAppointments.filter(a => a.kine?._id === kine._id);
      const completed = kineAppointments.filter(a => a.status === 'done').length;
      const total = kineAppointments.length;
      return {
        name: kine.name,
        total,
        completed,
        pending: kineAppointments.filter(a => a.status === 'pending').length,
      };
    }).sort((a, b) => b.total - a.total);

  // Assign kine to appointment
  const handleAssignKine = async (appointmentId, kineId) => {
    try {
      await api.patch(`/appointments/${appointmentId}/assign-kine`, { kineId });
      toast.success(currentLang === 'ar' ? 'تم تعيين المعالج' : 'Kiné assigné avec succès');
      fetchAllData();
    } catch (error) {
      toast.error(currentLang === 'ar' ? 'خطأ في تعيين المعالج' : 'Erreur lors de l\'assignation');
    }
  };

  // Update appointment status
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await api.patch(`/appointments/${appointmentId}`, { status: newStatus });
      toast.success(currentLang === 'ar' ? 'تم تحديث الحالة' : 'Statut mis à jour');
      fetchAllData();
    } catch (error) {
      toast.error(currentLang === 'ar' ? 'خطأ في تحديث الحالة' : 'Erreur lors de la mise à jour');
    }
  };

  // Update appointment date
  const handleStartEditDate = (appointment) => {
    setEditingDateId(appointment._id);
    const appointmentDate = new Date(appointment.date);
    setNewDate(format(appointmentDate, 'yyyy-MM-dd'));
    setNewTime(format(appointmentDate, 'HH:mm'));
  };

  const handleCancelEditDate = () => {
    setEditingDateId(null);
    setNewDate('');
    setNewTime('');
  };

  const handleSaveDate = async (appointmentId) => {
    try {
      if (!newDate || !newTime) {
        toast.error(currentLang === 'ar' ? 'يرجى إدخال التاريخ والوقت' : 'Veuillez saisir la date et l\'heure');
        return;
      }

      // Find the appointment to get its current status
      const appointment = allAppointments.find(apt => apt._id === appointmentId);
      if (!appointment) {
        toast.error(currentLang === 'ar' ? 'خطأ في العثور على الموعد' : 'Rendez-vous introuvable');
        return;
      }

      // Combine date and time in LOCAL timezone (without Z)
      // This creates a date object in the local timezone, then converts to UTC for storage
      const [hours, minutes] = newTime.split(':');
      const combinedDateTime = new Date(newDate);
      combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      await api.patch(`/appointments/${appointmentId}`, { 
        date: combinedDateTime.toISOString(),
        status: appointment.status // Include current status
      });
      toast.success(currentLang === 'ar' ? 'تم تحديث التاريخ' : 'Date mise à jour');
      setEditingDateId(null);
      setNewDate('');
      setNewTime('');
      fetchAllData();
    } catch (error) {
      console.error('Error updating date:', error);
      const errorMessage = error.response?.data?.message || (currentLang === 'ar' ? 'خطأ في تحديث التاريخ' : 'Erreur lors de la mise à jour de la date');
      toast.error(errorMessage);
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm(currentLang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Êtes-vous sûr de vouloir supprimer?')) {
      return;
    }

    try {
      await api.delete(`/appointments/${appointmentId}`);
      toast.success(currentLang === 'ar' ? 'تم الحذف' : 'Supprimé avec succès');
      fetchAllData();
    } catch (error) {
      toast.error(currentLang === 'ar' ? 'خطأ في الحذف' : 'Erreur lors de la suppression');
    }
  };

  // Toggle user active status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.patch(`/users/${userId}`, { isActive: !currentStatus });
      toast.success(currentLang === 'ar' ? 'تم تحديث الحالة' : 'Statut utilisateur mis à jour');
      fetchAllData();
    } catch (error) {
      toast.error(currentLang === 'ar' ? 'خطأ' : 'Erreur');
    }
  };

  // Filter appointments - with safety checks
  const filteredAppointments = allAppointments
    .filter(apt => apt && apt._id) // Remove null/undefined appointments
    .filter(apt => {
      const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
      const matchesSearch = searchTerm === '' ||
        (apt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.guestInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (apt.kine?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesStatus && matchesSearch;
    });

  if (isLoading || loadingData) {
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
            {currentLang === 'ar'
              ? `مرحبا ${user?.name}! إدارة النظام الكاملة`
              : `Bienvenue ${user?.name} ! Gestion complète du système`
            }
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setViewMode('overview')}
            className={`btn ${viewMode === 'overview' ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          >
            <Activity className="w-4 h-4 mr-2" />
            <span>{currentLang === 'ar' ? 'نظرة عامة' : 'Vue d\'ensemble'}</span>
          </button>
          <button
            onClick={() => setViewMode('appointments')}
            className={`btn ${viewMode === 'appointments' ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span>{currentLang === 'ar' ? 'المواعيد' : 'Rendez-vous'} ({totalAppointments})</span>
          </button>
          <button
            onClick={() => setViewMode('users')}
            className={`btn ${viewMode === 'users' ? 'btn-primary' : 'btn-secondary'} flex items-center`}
          >
            <Users className="w-4 h-4 mr-2" />
            <span>{currentLang === 'ar' ? 'المستخدمون' : 'Utilisateurs'}</span>
          </button>
        </div>

        {/* OVERVIEW MODE */}
        {viewMode === 'overview' && (
          <>
            {/* Main KPIs */}
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
                      {currentLang === 'ar' ? 'إجمالي المواعيد' : 'Total Rendez-vous'}
                    </p>
                    <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{totalAppointments}</p>
                    <p className="text-xs mt-1" style={{ color: '#00838f' }}>
                      {thisWeekAppointments} {currentLang === 'ar' ? 'هذا الأسبوع' : 'cette semaine'}
                    </p>
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
                      {currentLang === 'ar' ? 'قيد الانتظار' : 'En attente'}
                    </p>
                    <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{pendingAppointments}</p>
                    <p className="text-xs mt-1" style={{ color: '#00838f' }}>
                      {currentLang === 'ar' ? 'يحتاج تأكيد' : 'Nécessite confirmation'}
                    </p>
                  </div>
                  <AlertCircle className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
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
                      {currentLang === 'ar' ? 'إجمالي المستخدمين' : 'Total Utilisateurs'}
                    </p>
                    <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{allUsers.length}</p>
                    <p className="text-xs mt-1" style={{ color: '#00838f' }}>
                      {totalKines} {currentLang === 'ar' ? 'معالج' : 'kinés'} | {totalPatients} {currentLang === 'ar' ? 'مريض' : 'patients'}
                    </p>
                  </div>
                  <Users className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
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
                      {currentLang === 'ar' ? 'الدفع' : 'Paiements'}
                    </p>
                    <p className="text-3xl font-bold" style={{ color: '#00695c' }}>{paidAppointments}</p>
                    <p className="text-xs mt-1" style={{ color: '#00838f' }}>
                      {unpaidAppointments} {currentLang === 'ar' ? 'غير مدفوع' : 'non payés'}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 opacity-50" style={{ color: '#00acc1' }} />
                </div>
              </motion.div>
            </div>

            {/* Secondary Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="card border border-kine-300/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-kine-600 font-medium">
                    {currentLang === 'ar' ? 'الحالة' : 'Statuts'}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{currentLang === 'ar' ? 'مؤكد' : 'Confirmés'}</span>
                    <span className="font-bold text-green-600">{confirmedAppointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{currentLang === 'ar' ? 'مكتمل' : 'Terminés'}</span>
                    <span className="font-bold text-blue-600">{completedAppointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{currentLang === 'ar' ? 'ملغى' : 'Annulés'}</span>
                    <span className="font-bold text-red-600">{cancelledAppointments}</span>
                  </div>
                </div>
              </div>

              <div className="card border border-kine-300/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-kine-600 font-medium">
                    {currentLang === 'ar' ? 'هذا الشهر' : 'Ce mois-ci'}
                  </p>
                  <TrendingUp className="w-5 h-5 text-kine-600" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-kine-600">{thisMonthAppointments}</span>
                  <span className="text-sm text-gray-500">
                    {currentLang === 'ar' ? 'موعد' : 'rendez-vous'}
                  </span>
                </div>
              </div>

              <div className="card border border-kine-300/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-kine-600 font-medium">
                    {currentLang === 'ar' ? 'المعالجون' : 'Kinés actifs'}
                  </p>
                  <CheckCircle className="w-5 h-5 text-kine-600" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-kine-600">{totalKines}</span>
                  <span className="text-sm text-gray-500">
                    {currentLang === 'ar' ? 'معالج' : 'kinésithérapeutes'}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Section in Overview */}
            <div className="space-y-8">

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
                        label={({ name, value }) => `${name}: ${value}`}
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
              {/* Monthly Trend */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentLang === 'ar' ? 'الاتجاه الشهري (30 يوم)' : 'Tendance mensuelle (30 jours)'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrendData}>
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
                      stroke="url(#colorGradient)"
                      strokeWidth={3}
                      name={currentLang === 'ar' ? 'المواعيد' : 'Rendez-vous'}
                      dot={{ fill: '#8B5CF6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* APPOINTMENTS MODE */}
        {viewMode === 'appointments' && (
          <>
            {/* Filters and Search */}
            <div className="card mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={currentLang === 'ar' ? 'بحث...' : 'Rechercher...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input"
                  >
                    <option value="all">{currentLang === 'ar' ? 'الكل' : 'Tous'}</option>
                    <option value="pending">{currentLang === 'ar' ? 'قيد الانتظار' : 'En attente'}</option>
                    <option value="confirmed">{currentLang === 'ar' ? 'مؤكد' : 'Confirmés'}</option>
                    <option value="done">{currentLang === 'ar' ? 'مكتمل' : 'Terminés'}</option>
                    <option value="cancelled">{currentLang === 'ar' ? 'ملغى' : 'Annulés'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'المريض' : 'Patient'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الخدمة' : 'Service'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'التاريخ' : 'Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'المعالج' : 'Kiné'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الوثيقة' : 'Document'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((apt) => {
                    const patientInfo = apt.patient || apt.guestInfo || {};
                    const serviceName = typeof apt.service === 'object'
                      ? (apt.service?.[currentLang] || apt.service?.fr || 'N/A')
                      : (apt.service || 'N/A');

                    return (
                      <tr key={apt._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{patientInfo.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{patientInfo.phone || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{serviceName}</div>
                        </td>
                        <td className="px-6 py-4">
                          {editingDateId === apt._id ? (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="space-y-2">
                                <input
                                  type="date"
                                  value={newDate}
                                  onChange={(e) => setNewDate(e.target.value)}
                                  className="text-sm border border-blue-300 rounded px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                  type="time"
                                  value={newTime}
                                  onChange={(e) => setNewTime(e.target.value)}
                                  className="text-sm border border-blue-300 rounded px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex space-x-2 pt-1">
                                  <button
                                    onClick={() => handleSaveDate(apt._id)}
                                    className="flex-1 flex items-center justify-center space-x-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{currentLang === 'ar' ? 'حفظ' : 'Sauver'}</span>
                                  </button>
                                  <button
                                    onClick={handleCancelEditDate}
                                    className="flex-1 flex items-center justify-center space-x-1 text-xs bg-gray-500 text-white px-3 py-1.5 rounded hover:bg-gray-600 transition-colors"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>{currentLang === 'ar' ? 'إلغاء' : 'Annuler'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleStartEditDate(apt)}
                              className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                              title={currentLang === 'ar' ? 'انقر للتعديل' : 'Cliquer pour modifier'}
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {format(new Date(apt.date), 'dd/MM/yyyy', { locale: fr })}
                              </div>
                              <div className="text-sm text-blue-600 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(apt.date), 'HH:mm')}</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {apt.kine ? (
                            <div className="text-sm text-gray-900">Dr. {apt.kine.name || 'N/A'}</div>
                          ) : (
                            <select
                              onChange={(e) => handleAssignKine(apt._id, e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                {currentLang === 'ar' ? 'تعيين معالج' : 'Assigner kiné'}
                              </option>
                              {kineList.filter(kine => kine && kine._id && kine.name).map((kine) => (
                                <option key={kine._id} value={kine._id}>
                                  {kine.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={apt.status}
                            onChange={(e) => handleUpdateStatus(apt._id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="pending">{currentLang === 'ar' ? 'قيد الانتظار' : 'En attente'}</option>
                            <option value="confirmed">{currentLang === 'ar' ? 'مؤكد' : 'Confirmé'}</option>
                            <option value="done">{currentLang === 'ar' ? 'مكتمل' : 'Terminé'}</option>
                            <option value="cancelled">{currentLang === 'ar' ? 'ملغى' : 'Annulé'}</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {apt.attachment?.url ? (
                            <a
                              href={apt.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-colors"
                              title={currentLang === 'ar' ? 'عرض الشهادة' : 'Voir le certificat'}
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteAppointment(apt._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {currentLang === 'ar' ? 'لا توجد مواعيد' : 'Aucun rendez-vous trouvé'}
                </div>
              )}
            </div>
          </>
        )}

        {/* USERS MODE */}
        {viewMode === 'users' && (
          <>
            <div className="card overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentLang === 'ar' ? 'قائمة المستخدمين' : 'Liste des utilisateurs'}
                </h3>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{currentLang === 'ar' ? 'إضافة مستخدم' : 'Ajouter utilisateur'}</span>
                </button>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الاسم' : 'Nom'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'البريد' : 'Email'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الهاتف' : 'Téléphone'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الدور' : 'Rôle'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {currentLang === 'ar' ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.filter(user => user && user._id).map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'kine' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {user.role === 'admin' ? (currentLang === 'ar' ? 'مدير' : 'Admin') :
                            user.role === 'kine' ? (currentLang === 'ar' ? 'معالج' : 'Kiné') :
                              (currentLang === 'ar' ? 'مريض' : 'Patient')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {user.isActive ? (currentLang === 'ar' ? 'نشط' : 'Actif') : (currentLang === 'ar' ? 'معطل' : 'Inactif')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-4">
                        <button
                          onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                          className="text-kine-900 hover:text-kine-900"
                          title={user.isActive ? (currentLang === 'ar' ? 'تعطيل' : 'Désactiver') : (currentLang === 'ar' ? 'تفعيل' : 'Activer')}
                        >
                          {user.isActive ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="text-gray-600 hover:text-gray-900"
                          title={currentLang === 'ar' ? 'تعديل' : 'Modifier'}
                        >
                          <Edit className="w-6 h-6" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {currentLang === 'ar' ? 'إضافة مستخدم جديد' : 'Ajouter un nouvel utilisateur'}
              </h3>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLang === 'ar' ? 'الاسم الكامل' : 'Nom complet'} *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLang === 'ar' ? 'رقم الهاتف' : 'Téléphone'} *
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="input"
                    required
                    placeholder={currentLang === 'ar' ? 'مثال: 0612345678' : 'Ex: 0612345678'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLang === 'ar' ? 'كلمة المرور' : 'Mot de passe'} *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="input"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLang === 'ar' ? 'الدور' : 'Rôle'} *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="patient">{currentLang === 'ar' ? 'مريض' : 'Patient'}</option>
                    <option value="kine">{currentLang === 'ar' ? 'معالج' : 'Kiné'}</option>
                    <option value="admin">{currentLang === 'ar' ? 'مدير' : 'Admin'}</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    {currentLang === 'ar' ? 'إضافة' : 'Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserModal(false);
                      setNewUser({ name: '', phone: '', password: '', role: 'patient' });
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    {currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {currentLang === 'ar' ? 'تعديل المستخدم' : 'Modifier l\'utilisateur'}
              </h3>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLang === 'ar' ? 'الاسم الكامل' : 'Nom complet'} *
                  </label>
                  <input
                    type="text"
                    value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLang === 'ar' ? 'رقم الهاتف' : 'Téléphone'} *
                  </label>
                  <input
                    type="tel"
                    value={editUser.phone}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                    className="input"
                    required
                    placeholder={currentLang === 'ar' ? 'مثال: 0612345678' : 'Ex: 0612345678'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLang === 'ar' ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                  </label>
                  <input
                    type="password"
                    value={editUser.password}
                    onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                    className="input"
                    minLength={6}
                    placeholder={currentLang === 'ar' ? 'اتركه فارغاً إذا لم ترغب في التغيير' : 'Laisser vide si non modifié'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {currentLang === 'ar' ? 'اتركه فارغاً للاحتفاظ بكلمة المرور الحالية' : 'Laisser vide pour conserver le mot de passe actuel'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {currentLang === 'ar' ? 'الدور' : 'Rôle'} *
                  </label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="patient">{currentLang === 'ar' ? 'مريض' : 'Patient'}</option>
                    <option value="kine">{currentLang === 'ar' ? 'معالج' : 'Kiné'}</option>
                    <option value="admin">{currentLang === 'ar' ? 'مدير' : 'Admin'}</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    {currentLang === 'ar' ? 'حفظ التغييرات' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditUserModal(false);
                      setSelectedUser(null);
                      setEditUser({ name: '', phone: '', role: 'patient', password: '' });
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    {currentLang === 'ar' ? 'إلغاء' : 'Annuler'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
