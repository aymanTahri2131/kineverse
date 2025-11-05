import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle2, ChevronRight, X } from 'lucide-react';
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
  for (let hour = 10; hour < 16; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
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
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { user, isAuthenticated } = useAuthStore();
  const { createAppointment, isLoading } = useAppointmentStore();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');

  // Booked slots data
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const timeSlots = generateTimeSlots();
  const dateSlots = generateDateSlots();

  useEffect(() => {
    fetchBookedSlots();
  }, []);

  const fetchBookedSlots = async () => {
    setLoadingSlots(true);
    try {
      const response = await api.get('/appointments');
      setBookedSlots(response.data.appointments || []);
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
      const slotDate = new Date(slot.date).toISOString().split('T')[0];
      const slotTime = new Date(slot.date).toTimeString().substring(0, 5);
      return slotDate === dateStr && slotTime === time && slot.status !== 'cancelled';
    });
  };

  // Check if all time slots for a date are booked
  const isDateFullyBooked = (date) => {
    return timeSlots.every(time => isTimeSlotBooked(date, time));
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return [];
    return timeSlots.filter(time => !isTimeSlotBooked(selectedDate, time));
  };

  // Handle step navigation
  const goToNextStep = () => {
    if (currentStep === 1 && (!fullName || !phone)) {
      toast.error(currentLang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Veuillez remplir tous les champs');
      return;
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
    setCurrentStep(currentStep - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedTime) {
      toast.error(currentLang === 'ar' ? 'يرجى اختيار وقت' : 'Veuillez sélectionner une heure');
      return;
    }

    const appointmentData = {
      service: selectedService.name[currentLang],
      date: new Date(`${selectedDate.toISOString().split('T')[0]}T${selectedTime}`).toISOString(),
      notes: notes,
      guestInfo: {
        name: fullName,
        phone: phone,
      }
    };

    try {
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
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6"
        >
            {/* Guest Info (if not authenticated) */}
            {!isAuthenticated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 mb-4">
                  Vous réservez en tant qu'invité. Créez un compte pour gérer vos rendez-vous plus facilement.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        className="input pl-10"
                        placeholder="Jean Dupont"
                        value={formData.guestInfo.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          guestInfo: { ...formData.guestInfo, name: e.target.value },
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        className="input pl-10"
                        placeholder="+212 6 00 00 00 00"
                        value={formData.guestInfo.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          guestInfo: { ...formData.guestInfo, phone: e.target.value },
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (optionnel)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        className="input pl-10"
                        placeholder="email@exemple.com"
                        value={formData.guestInfo.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          guestInfo: { ...formData.guestInfo, email: e.target.value },
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service *
              </label>
              <select
                required
                className="input"
                value={selectedService?._id || ''}
                onChange={(e) => handleServiceChange(e.target.value)}
              >
                <option value="">Sélectionnez un service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name} - {service.price} DH ({service.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Subservice Selection */}
            {selectedService && selectedService.subservices && selectedService.subservices.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialité
                </label>
                <select
                  className="input"
                  value={formData.subservice}
                  onChange={(e) => setFormData({ ...formData, subservice: e.target.value })}
                >
                  <option value="">Sélectionnez une spécialité (optionnel)</option>
                  {selectedService.subservices.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Kine Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kinésithérapeute *
              </label>
              <select
                required
                className="input"
                value={formData.kine}
                onChange={(e) => setFormData({ ...formData, kine: e.target.value })}
              >
                <option value="">Sélectionnez un kinésithérapeute</option>
                {kines.map((kine) => (
                  <option key={kine._id} value={kine._id}>
                    {kine.name} {kine.specialty && `- ${kine.specialty}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    className="input pl-10"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure *
                </label>
                <input
                  type="time"
                  required
                  className="input"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optionnel)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  rows="3"
                  className="input pl-10"
                  placeholder="Informations complémentaires..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Réservation en cours...</span>
                </>
              ) : (
                'Confirmer le rendez-vous'
              )}
            </button>

            <p className="text-sm text-gray-500 text-center">
              Vous recevrez une confirmation par email et SMS une fois votre rendez-vous validé par le kinésithérapeute.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
