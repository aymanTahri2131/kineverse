import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, ChevronRight, ChevronLeft, FileText, Upload, X, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import useAppointmentStore from '../store/appointmentStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

// Services list (imported from Home.jsx concept)
const SERVICES = [
  { id: 1, name: { fr: 'Rééducation en traumatologie', ar: 'الترويض الطبي لامراض العضام و الكسور' } },
  { id: 2, name: { fr: 'Rééducation en rhumatologie', ar: 'الترويض الطبي لامراض الروماتيزم' } },
  { id: 3, name: { fr: 'Rééducation en neurologie', ar: 'الترويض الطبي لامراض الجهاز العصبي' } },
  { id: 4, name: { fr: 'Rééducation en cardiologie', ar: 'الترويض و التاهيل الطبي لامراض القلب و الشرايين' } },
  { id: 5, name: { fr: 'Rééducation en pneumologie', ar: 'الترويض و التاهيل الطبي لامراض الجهاز التفسي' } },
  { id: 6, name: { fr: "Kinésitherapie respiratoire chez l'enfant", ar: 'ترويض و تاهيل الجهاز التنفسي للاطفال' } },
  { id: 7, name: { fr: 'Rééducation en gériatrie', ar: 'تاهيل العجزة' } },
  { id: 8, name: { fr: 'Ventouse thérapie (hijama)', ar: 'الحجامة الطبية' } },
  { id: 9, name: { fr: 'Massage et drainage lymphatique', ar: 'التدليك و الصرف اللمفاوي' } }
];

// Generate time slots from 10:00 to 16:00 (30 min intervals)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour <= 16; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 16) { // Don't add :30 after 16:00
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

// Generate date slots (today to +10 days, excluding Sundays)
const generateDateSlots = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 20; i++) { // Check more days to get 10 non-Sunday dates
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip Sundays (0 = Sunday)
    if (date.getDay() !== 0) {
      dates.push(date);
    }
    
    // Stop when we have 10 dates
    if (dates.length === 10) break;
  }
  
  return dates;
};

export default function AppointmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { user, isAuthenticated } = useAuthStore();
  const { createAppointment, isLoading } = useAppointmentStore();

  // Step management - Start at step 2 ONLY if user is authenticated as patient
  // Kine and admin start at step 1 (need to select patient or enter guest info)
  const [currentStep, setCurrentStep] = useState(
    isAuthenticated && user?.role === 'patient' ? 2 : 1
  );
  
  // Form data - Auto-fill ONLY if authenticated patient
  const [fullName, setFullName] = useState(
    isAuthenticated && user?.role === 'patient' ? user.name : ''
  );
  const [phone, setPhone] = useState(
    isAuthenticated && user?.role === 'patient' ? user.phone : ''
  );
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [medicalCertificate, setMedicalCertificate] = useState(null);
  const [certificatePreview, setCertificatePreview] = useState(null);

  // Admin: patient selection
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Booked slots data
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const timeSlots = generateTimeSlots();
  const dateSlots = generateDateSlots();

  useEffect(() => {
    fetchBookedSlots();
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'kine')) {
      fetchPatients();
    }
    
    // Pre-select service if passed from navigation
    if (location.state?.serviceId) {
      const service = SERVICES.find(s => s.id === location.state.serviceId);
      if (service) {
        setSelectedService(service);
      }
    }
  }, [location.state]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await api.get('/users?role=patient');
      setPatients(response.data.users || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error(currentLang === 'ar' ? 'خطأ في تحميل المرضى' : 'Erreur lors du chargement des patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchBookedSlots = async () => {
    setLoadingSlots(true);
    try {
      // Use the optimized booked-slots endpoint
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 15); // Get slots for next 15 days
      
      const response = await api.get('/appointments/booked-slots', {
        params: {
          startDate: today.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      console.log('📅 Booked slots received:', response.data.bookedSlots);
      setBookedSlots(response.data.bookedSlots || []);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Check if a specific time slot is booked for a specific date
  const isTimeSlotBooked = (date, time) => {
    if (!bookedSlots.length) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    return bookedSlots.some(slot => {
      const slotDateTime = new Date(slot.date);
      const slotDateStr = slotDateTime.toISOString().split('T')[0];
      // Extract time in HH:MM format using local time
      const hours = String(slotDateTime.getHours()).padStart(2, '0');
      const minutes = String(slotDateTime.getMinutes()).padStart(2, '0');
      const slotTime = `${hours}:${minutes}`;
      
      console.log('Checking slot:', { 
        dateStr, 
        time, 
        slotDateStr, 
        slotTime, 
        match: slotDateStr === dateStr && slotTime === time 
      });
      
      return slotDateStr === dateStr && slotTime === time && slot.status !== 'cancelled';
    });
  };

  // Check if all time slots for a date are booked
  const isDateFullyBooked = (date) => {
    return timeSlots.every(time => isTimeSlotBooked(date, time));
  };

  // Handle medical certificate upload
  const handleCertificateUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error(currentLang === 'ar' ? 'نوع الملف غير مدعوم. يرجى تحميل صورة أو PDF' : 'Type de fichier non supporté. Veuillez télécharger une image ou un PDF');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(currentLang === 'ar' ? 'حجم الملف كبير جدا. الحد الأقصى 5 ميغابايت' : 'Fichier trop volumineux. Maximum 5MB');
        return;
      }

      setMedicalCertificate(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCertificatePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setCertificatePreview(null);
      }
    }
  };

  const removeCertificate = () => {
    setMedicalCertificate(null);
    setCertificatePreview(null);
  };

  // Handle step navigation
  const goToNextStep = () => {
    // Skip step 1 validation for authenticated patients (already have info)
    const isAuthenticatedPatient = isAuthenticated && user?.role === 'patient';
    const isAdminOrKine = isAuthenticated && (user?.role === 'admin' || user?.role === 'kine');
    
    if (currentStep === 1 && !isAuthenticatedPatient) {
      // Admin/Kine must select a patient OR provide guest info
      if (isAdminOrKine && !selectedPatient && (!fullName || !phone)) {
        toast.error(currentLang === 'ar' ? 'يرجى اختيار مريض أو ملء معلومات الضيف' : 'Veuillez sélectionner un patient ou remplir les informations');
        return;
      }
      // Guest must provide name and phone
      if (!isAdminOrKine && (!fullName || !phone)) {
        toast.error(currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs');
        return;
      }
    }
    if (currentStep === 2 && !selectedService) {
      toast.error(currentLang === 'ar' ? 'يرجى اختيار خدمة' : 'Veuillez sélectionner un service');
      return;
    }
    if (currentStep === 3 && !selectedDate) {
      toast.error(currentLang === 'ar' ? 'يرجى اختيار تاريخ' : 'Veuillez sélectionner une date');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const goToPreviousStep = () => {
    // If authenticated patient, don't go below step 2
    const minStep = isAuthenticated && user?.role === 'patient' ? 2 : 1;
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedTime) {
      toast.error(currentLang === 'ar' ? 'يرجى اختيار وقت' : 'Veuillez sélectionner une heure');
      return;
    }

    // Create date in local timezone (not UTC)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const [hours, minutes] = selectedTime.split(':');
    
    // Create date string in local timezone format (ISO 8601 without Z)
    const appointmentDateTime = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00`);

    try {
      // If there's a medical certificate, upload it first
      let attachmentData = null;
      if (medicalCertificate) {
        const formData = new FormData();
        formData.append('certificate', medicalCertificate);
        
        try {
          const uploadResponse = await api.post('/appointments/upload-certificate', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          attachmentData = {
            url: uploadResponse.data.url,
            publicId: uploadResponse.data.publicId
          };
        } catch (uploadError) {
          console.error('Error uploading certificate:', uploadError);
          toast.error(currentLang === 'ar' ? 
            'فشل تحميل الوصفة الطبية' : 
            'Échec du téléchargement de l\'ordonnance'
          );
          // Continue without certificate
        }
      }

      const appointmentData = {
        service: {
          fr: selectedService.name.fr,
          ar: selectedService.name.ar
        },
        date: appointmentDateTime.toISOString(),
        notes: notes,
        attachment: attachmentData,
      };

      // Admin/Kine booking for a patient
      const isAdminOrKine = isAuthenticated && (user?.role === 'admin' || user?.role === 'kine');
      if (isAdminOrKine && selectedPatient) {
        appointmentData.patientId = selectedPatient._id;
      } else if (!isAuthenticated || (isAdminOrKine && !selectedPatient)) {
        // Guest booking
        appointmentData.guestInfo = {
          name: fullName,
          phone: phone,
        };
      }

      await createAppointment(appointmentData);
      toast.success(currentLang === 'ar' ? 
        'تم حجز موعدك بنجاح! ستتلقى رسالة تأكيد.' : 
        'Rendez-vous créé avec succès ! Vous recevrez une confirmation.'
      );
      
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 
        (currentLang === 'ar' ? 'حدث خطأ أثناء الحجز' : 'Erreur lors de la réservation')
      );
    }
  };

  // Format date for display
  const formatDate = (date) => {
    const days = currentLang === 'ar' ? 
      ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] :
      ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = currentLang === 'ar' ?
      ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'] :
      ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()]
    };
  };

  if (loadingSlots) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kine-50 via-white to-kine-50 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            {currentLang === 'ar' ? 'حجز موعد' : 'Réserver un Rendez-vous'}
          </h1>
          <p className="text-lg text-gray-600">
            {currentLang === 'ar' ? 
              'احجز موعدك في خطوات بسيطة' : 
              'Prenez rendez-vous en quelques étapes'}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    currentStep >= step 
                      ? 'bg-kine-600 text-white shadow-lg scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step ? <CheckCircle2 size={20} /> : step}
                  </div>
                  <span className={`text-xs md:text-sm mt-2 font-medium ${
                    currentStep >= step ? 'text-kine-600' : 'text-gray-400'
                  }`}>
                    {step === 1 && (currentLang === 'ar' ? 'المعلومات' : 'Info')}
                    {step === 2 && (currentLang === 'ar' ? 'الخدمة' : 'Service')}
                    {step === 3 && (currentLang === 'ar' ? 'التاريخ' : 'Date')}
                    {step === 4 && (currentLang === 'ar' ? 'الوقت' : 'Heure')}
                  </span>
                </div>
                {step < 4 && (
                  <div className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                    currentStep > step ? 'bg-kine-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 min-h-[400px]"
          >
            {/* Step 1: User Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="text-kine-600" />
                    {isAuthenticated && (user?.role === 'admin' || user?.role === 'kine')
                      ? (currentLang === 'ar' ? 'اختر المريض أو أدخل معلومات الضيف' : 'Sélectionner un patient ou invité')
                      : (currentLang === 'ar' ? 'معلوماتك الشخصية' : 'Vos informations')
                    }
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Admin/Kine: Patient Selection */}
                    {isAuthenticated && (user?.role === 'admin' || user?.role === 'kine') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {currentLang === 'ar' ? 'اختر مريض مسجل' : 'Sélectionner un patient enregistré'}
                        </label>
                        {loadingPatients ? (
                          <div className="text-center py-4">
                            <LoadingSpinner />
                          </div>
                        ) : (
                          <select
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-kine-600 focus:ring-2 focus:ring-kine-200 transition-all"
                            value={selectedPatient?._id || ''}
                            onChange={(e) => {
                              const patient = patients.find(p => p._id === e.target.value);
                              setSelectedPatient(patient || null);
                              if (patient) {
                                setFullName('');
                                setPhone('');
                              }
                            }}
                          >
                            <option value="">
                              {currentLang === 'ar' ? '-- اختر مريض أو اترك فارغ للضيف --' : '-- Sélectionner un patient ou laisser vide pour invité --'}
                            </option>
                            {patients.map((patient) => (
                              <option key={patient._id} value={patient._id}>
                                {patient.name} - {patient.phone}
                              </option>
                            ))}
                          </select>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {currentLang === 'ar' 
                            ? 'أو اترك فارغًا وأدخل معلومات الضيف أدناه' 
                            : 'Ou laissez vide et remplissez les informations invité ci-dessous'
                          }
                        </p>
                      </div>
                    )}

                    {/* Guest Info (visible for: non-authenticated, kine, admin) */}
                    {(!isAuthenticated || user?.role === 'admin' || user?.role === 'kine') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {currentLang === 'ar' ? 'الاسم الكامل *' : 'Nom complet *'}
                            {isAuthenticated && (user?.role === 'admin' || user?.role === 'kine') && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({currentLang === 'ar' ? 'للضيوف فقط' : 'pour invités uniquement'})
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            disabled={selectedPatient !== null}
                            className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-kine-600 focus:ring-2 focus:ring-kine-200 transition-all ${selectedPatient ? 'bg-gray-100' : ''}`}
                            placeholder={currentLang === 'ar' ? 'أدخل اسم المريض' : 'Entrez le nom du patient'}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {currentLang === 'ar' ? 'رقم الهاتف *' : 'Téléphone *'}
                            {isAuthenticated && (user?.role === 'admin' || user?.role === 'kine') && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({currentLang === 'ar' ? 'للضيوف فقط' : 'pour invités uniquement'})
                              </span>
                            )}
                          </label>
                          <input
                            type="tel"
                            disabled={selectedPatient !== null}
                            className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-kine-600 focus:ring-2 focus:ring-kine-200 transition-all ${selectedPatient ? 'bg-gray-100' : ''}`}
                            placeholder="+212 6 00 00 00 00"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Service Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {currentLang === 'ar' ? 'اختر الخدمة' : 'Choisissez votre service'}
                </h3>
                <div className="grid gap-3">
                  {SERVICES.map((service) => (
                    <motion.button
                      key={service.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedService?.id === service.id
                          ? 'border-kine-600 bg-kine-50 shadow-lg'
                          : 'border-gray-200 hover:border-kine-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {service.name[currentLang]}
                        </span>
                        {selectedService?.id === service.id && (
                          <CheckCircle2 className="text-kine-600" size={24} />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Date Selection */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {currentLang === 'ar' ? 'اختر التاريخ' : 'Choisissez une date'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {dateSlots.map((date, index) => {
                    const formatted = formatDate(date);
                    const isBooked = isDateFullyBooked(date);
                    
                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: isBooked ? 1 : 1.05 }}
                        whileTap={{ scale: isBooked ? 1 : 0.95 }}
                        disabled={isBooked}
                        onClick={() => setSelectedDate(date)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedDate?.toDateString() === date.toDateString()
                            ? 'border-kine-600 bg-kine-600 text-white shadow-lg'
                            : isBooked
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-kine-300 hover:shadow-md'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-xs mb-1">{formatted.day}</div>
                          <div className="text-2xl font-bold">{formatted.date}</div>
                          <div className="text-xs mt-1">{formatted.month}</div>
                          {isBooked && (
                            <div className="text-xs mt-2 text-red-500">
                              {currentLang === 'ar' ? 'ممتلئ' : 'Complet'}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Time Selection */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentLang === 'ar' ? 'اختر الوقت' : 'Choisissez l\'heure'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedDate && `${formatDate(selectedDate).day} ${formatDate(selectedDate).date} ${formatDate(selectedDate).month}`}
                </p>
                
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {timeSlots.map((time) => {
                    const isBooked = isTimeSlotBooked(selectedDate, time);
                    
                    return (
                      <motion.button
                        key={time}
                        whileHover={{ scale: isBooked ? 1 : 1.05 }}
                        whileTap={{ scale: isBooked ? 1 : 0.95 }}
                        onClick={() => !isBooked && setSelectedTime(time)}
                        disabled={isBooked}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedTime === time
                            ? 'border-kine-600 bg-kine-600 text-white shadow-lg'
                            : isBooked
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                            : 'border-gray-200 hover:border-kine-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Clock size={18} />
                          <span className="font-medium">{time}</span>
                        </div>
                        {isBooked && (
                          <div className="text-xs mt-1 text-red-500">
                            {currentLang === 'ar' ? 'محجوز' : 'Réservé'}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {timeSlots.every(time => isTimeSlotBooked(selectedDate, time)) && (
                  <div className="text-center py-8 text-gray-500">
                    {currentLang === 'ar' ? 
                      'جميع الأوقات محجوزة لهذا اليوم' : 
                      'Tous les créneaux sont réservés pour ce jour'}
                  </div>
                )}

                {/* Medical Certificate Upload */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLang === 'ar' ? 'وصفة طبية (اختياري)' : 'Ordonnance (optionnel)'}
                  </label>
                  
                  {!medicalCertificate ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-kine-400 transition-all">
                      <input
                        type="file"
                        id="certificate-upload"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleCertificateUpload}
                        capture="environment"
                      />
                      <label
                        htmlFor="certificate-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <div className="flex gap-4">
                          <div className="p-3 bg-kine-100 rounded-full">
                            <Camera className="w-6 h-6 text-kine-600" />
                          </div>
                          <div className="p-3 bg-kine-100 rounded-full">
                            <Upload className="w-6 h-6 text-kine-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {currentLang === 'ar' ? 
                              'التقط صورة أو قم بتحميل ملف' : 
                              'Prendre une photo ou télécharger un fichier'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {currentLang === 'ar' ? 
                              'PNG, JPG, GIF أو PDF (حتى 5 ميغابايت)' : 
                              'PNG, JPG, GIF ou PDF (max 5MB)'}
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="border-2 border-kine-200 rounded-lg p-4 bg-kine-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {certificatePreview ? (
                            <img
                              src={certificatePreview}
                              alt="Certificate preview"
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="p-3 bg-kine-100 rounded-lg">
                              <FileText className="w-8 h-8 text-kine-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {medicalCertificate.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(medicalCertificate.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeCertificate}
                          className="p-1 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentLang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optionnel)'}
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-kine-600 focus:ring-2 focus:ring-kine-200 transition-all"
                    placeholder={currentLang === 'ar' ? 'أضف أي ملاحظات...' : 'Ajoutez des notes...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {currentStep > 1 && (
            <button
              onClick={goToPreviousStep}
              className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              {currentLang === 'ar' ? 'السابق' : 'Précédent'}
            </button>
          )}
          
          <div className="flex-1" />

          {currentStep < 4 ? (
            <button
              onClick={goToNextStep}
              className="btn btn-primary flex items-center gap-2"
            >
              {currentLang === 'ar' ? 'التالي' : 'Suivant'}
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !selectedTime}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>{currentLang === 'ar' ? 'جارٍ الحجز...' : 'Réservation...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>{currentLang === 'ar' ? 'تأكيد الحجز' : 'Confirmer'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
