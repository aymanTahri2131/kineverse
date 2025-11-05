import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, Star, Clock } from 'lucide-react';
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Bandage, MedicalCross, Pill, Syringe, Thermometer, Dna, Heartbeat } from '../components/MedicalIcons';
import ServiceCard3D from '../components/ServiceCard3D';
import ContactForm from '../components/ContactForm';
import { getModelUrl } from '../config/models';

// Lazy load the 3D scenes for better performance
const KineScene = lazy(() => import('../components/KineScene'));

// Static services list
const SERVICES = [
  {
    id: 1,
    name: { fr: 'Rééducation en traumatologie', ar: 'الترويض الطبي لامراض العضام و الكسور' },
    icon: 'Bandage',
    description: { fr: 'Rééducation après traumatisme ou chirurgie', ar: 'إعادة التأهيل بعد الإصابة أو الجراحة' },
    modelPath: getModelUrl('skeleton.glb'),
    modelConfig: {
      scale: 0.2,
      position: [0, 0, 0],
      cameraPosition: [0, -2, 15]
    }
  },
  {
    id: 2,
    name: { fr: 'Rééducation en rhumatologie', ar: 'الترويض الطبي لامراض الروماتيزم' },
    icon: 'MedicalCross',
    description: { fr: 'Traitement des maladies rhumatismales', ar: 'علاج الأمراض الروماتيزمية' },
    modelPath: getModelUrl('leg.glb'),
    modelConfig: {
      scale: 0.2,
      position: [0, -1, 1],
      cameraPosition: [0, 0, 8],
      inflammationSpots: [
        { position: [0, -7, 0], radius: 2, opacity: 0.2 }  // Ankle
      ]
    }
  },
  {
    id: 3,
    name: { fr: 'Rééducation en neurologie', ar: 'الترويض الطبي لامراض الجهاز العصبي' },
    icon: 'Dna',
    description: { fr: 'Rééducation neurologique spécialisée', ar: 'إعادة التأهيل العصبي المتخصص' },
    modelPath: getModelUrl('brain.glb'),
    modelConfig: {
      scale: 2.5,
      position: [0, 0, 0],
      cameraPosition: [0, 0, 1]
    }
  },
  {
    id: 4,
    name: { fr: 'Rééducation en cardiologie', ar: 'الترويض و التاهيل الطبي لامراض القلب و الشرايين' },
    icon: 'Heartbeat',
    description: { fr: 'Réadaptation cardiaque et vasculaire', ar: 'إعادة التأهيل القلبي والأوعية الدموية' },
    modelPath: getModelUrl('heart.glb'),
    modelConfig: {
      scale: 3,
      position: [0, 1, 1],
      cameraPosition: [0, 1, 3], // Move camera back to see the model
      disableAutoRotation: true,
      heartbeat: true
    }
  },
  {
    id: 5,
    name: { fr: 'Rééducation en pneumologie', ar: 'الترويض و التاهيل الطبي لامراض الجهاز التفسي' },
    icon: 'Stethoscope',
    description: { fr: 'Rééducation respiratoire', ar: 'إعادة التأهيل التنفسي' },
    modelPath: '/models/lungs.glb',
    modelConfig: {
      scale: 4,
      position: [0, 0, 0],
      cameraPosition: [0, 1, 2],
      disableAutoRotation: true,
      breathing: true
    }
  },
  {
    id: 6,
    name: { fr: "Kinésitherapie respiratoire chez l'enfant", ar: 'ترويض و تاهيل الجهاز التنفسي للاطفال' },
    icon: 'Thermometer',
    description: { fr: 'Soins respiratoires pédiatriques', ar: 'رعاية الجهاز التنفسي للأطفال' },
    modelPath: getModelUrl('baby.glb'),
    modelConfig: {
      scale: 1,
      position: [0, 0.1, 0],
      cameraPosition: [0, -1, 1.5],
      disableAutoRotation: false,
      breathing: true, // Add gentle breathing animation for baby
      breathingSpeed: 1.5, // Faster breathing rate for baby (babies breathe faster)
      breathingIntensity: 0.03 // Gentle breathing movement
    }
  },
  {
    id: 7,
    name: { fr: 'Rééducation en gériatrie', ar: 'تاهيل العجزة' },
    icon: 'Users',
    description: { fr: 'Soins adaptés aux personnes âgées', ar: 'رعاية مخصصة لكبار السن' },
    modelPath: getModelUrl('old.glb'),
    modelConfig: {
      scale: 2,
      position: [0, 0, 0],
      cameraPosition: [0, 2.5, 1.5]
      // Auto-rotation and manual rotation enabled by default
    }
  },
  {
    id: 8,
    name: { fr: 'Ventouse thérapie (hijama)', ar: 'الحجامة الطبية' },
    icon: 'Syringe',
    description: { fr: 'Thérapie par ventouses traditionnelle', ar: 'العلاج بالحجامة التقليدية' },
    modelPath: getModelUrl('hijama.glb'),
    modelConfig: {
      scale: 2,
      position: [2, -1, 0],
      cameraPosition: [0, 0.5, 0.5],
      disableAutoRotation: true,
      heartbeat: true
      // Rotation enabled by default (no disable flags)
    }
  },
  {
    id: 9,
    name: { fr: 'Massage et drainage lymphatique', ar: 'التدليك و الصرف اللمفاوي' },
    icon: 'Pill',
    description: { fr: 'Massage thérapeutique et drainage', ar: 'التدليك العلاجي والتصريف' },
    modelPath: '/models/lymphatic.glb',
    modelConfig: {
      scale: 3,
      position: [0, 0, 0],
      rotation: [0, -1.5, 0],
      cameraPosition: [0, 0, 3],
      disableRotation: false, // Enable manual rotation
      disableAutoRotation: true // Enable automatic rotation
    }
  }
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();

  const handleBookService = () => {
    navigate('/book');
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section with 3D placeholder */}
      <section className="relative bg-gradient-to-br from-kine-600 via-kine-700 to-kine-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        {/* Floating Icons */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 0, 10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-80 text-light-600 opacity-20 hidden lg:block"
        >
          <Stethoscope size={64} />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [0, -5, 5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-40 right-96 text-light-500 opacity-25 hidden lg:block"
        >
          <Dna size={80} />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 40, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-20 left-1/3 text-light-400 opacity-20 hidden lg:block"
        >
          <MedicalCross size={96} />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, -8, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 left-32 text-light-600 opacity-25 hidden md:block"
        >
          <Bandage size={80} />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 22, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          className="absolute top-3/4 right-56 text-light-300 opacity-20 hidden lg:block"
        >
          <Syringe size={64} />
        </motion.div>
       
        {/* Floating Circles */}
        <motion.div
          animate={{ 
            scale: [0.3, 0.7, 0.3],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 left-28 w-12 h-12 rounded-full border"
        />
        
        <motion.div
          animate={{ 
            scale: [0.7, 1, 0.7],
            opacity: [0, 0.4, 0]
          }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-24 left-1/3 w-24 h-24 rounded-full border"
        />
        
        <motion.div
          animate={{ 
            scale: [0.5, 1, 0.5],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/2 right-20 w-16 h-16 rounded-full border"
        />
        
        <motion.div
          animate={{ 
            scale: [0.5, 1, 0.5],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute bottom-56 left-1/2 w-12 h-12 rounded-full border"
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="block">{t('home.title')}</span>
                <span className="block text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl my-2 mb-6">
                  {t('home.appName')}
                </span> 
                <span className="block text-kine-100 text-base sm:text-2xl md:text-3xl mt-1">
                  {t('home.subAppName')}
                </span>
              </h1>
              <p className="text-base sm:text-xl md:text-2xl mb-8 text-white w-[400px] sm:w-[400px] md:w-auto">
                {t('home.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/book" className="btn btn-primary bg-white text-kine-700 hover:bg-primary-800 hover:text-white">
                  {t('home.bookAppointment')}
                </Link>
                <a 
                  href="#services" 
                  className="btn btn-outline border-white text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {t('home.ourServices')}
                </a>
              </div>
            </motion.div>

            {/* 3D Scene with Character */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <Suspense
                fallback={
                  <div className="aspect-square backdrop-blur-sm rounded-3xl p-8 flex items-center justify-center">
                    <div className="text-center">
                      
                      <p className="text-lg text-kine-100">{t('common.loading')}</p>
                    </div>
                  </div>
                }
              >
                <KineScene />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('home.whyChoose')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home.whySubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card hover:bg-kine-600/15 backdrop-blur-md text-center transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-kine-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-kine-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature1Title')}</h3>
              <p className="text-gray-600">
                {t('home.feature1Desc')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card hover:bg-kine-600/15 backdrop-blur-md text-center transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-kine-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-kine-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature2Title')}</h3>
              <p className="text-gray-600">
                {t('home.feature2Desc')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card hover:bg-kine-600/15 backdrop-blur-md text-center transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-kine-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-kine-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature3Title')}</h3>
              <p className="text-gray-600">
                {t('home.feature3Desc')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card hover:bg-kine-600/15 backdrop-blur-md text-center transition-all duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-kine-100 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-kine-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('home.feature4Title')}</h3>
              <p className="text-gray-600">
                {t('home.feature4Desc')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative py-24 bg-kine-600 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Main gradient overlay */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          
          {/* Animated orbs */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -left-40 w-96 h-96 bg-kine-400/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
              x: [0, -50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-40 -right-40 w-96 h-96 bg-kine-800/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block px-4 py-2 mb-6 text-sm font-semibold text-kine-900 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
            >
              {currentLang === 'ar' ? 'خدماتنا المتخصصة' : 'Nos Services Spécialisés'}
            </motion.span>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg"
            >
              {t('services.title')}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md"
            >
              {t('services.subtitle')}
            </motion.p>

            {/* Decorative line */}
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '100px' }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="h-1.5 bg-white rounded-full mx-auto mt-8 shadow-lg"
            />
          </motion.div>

          {/* Services Bento Grid with 3 sections */}
          <div className="space-y-10 w-full max-w-full">
            
            {/* Section 1: Cards 1, 2, 3 - grid-cols-2 grid-rows-4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-4 gap-6 auto-rows-[minmax(150px,auto)]">
              {/* Card 1 - row-span-4 (tall left) */}
              <Suspense
                fallback={
                  <div className="md:row-span-4 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:row-span-4">
                  <ServiceCard3D
                    service={SERVICES[0]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={0}
                    isLarge={true}
                  />
                </div>
              </Suspense>

              {/* Card 2 - row-span-2 (top right) */}
              <Suspense
                fallback={
                  <div className="md:row-span-2 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:row-span-2">
                  <ServiceCard3D
                    service={SERVICES[1]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={1}
                    isLarge={false}
                  />
                </div>
              </Suspense>

              {/* Card 3 - row-span-2 (bottom right) */}
              <Suspense
                fallback={
                  <div className="md:row-span-2 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:row-span-2">
                  <ServiceCard3D
                    service={SERVICES[2]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={2}
                    isLarge={false}
                  />
                </div>
              </Suspense>
            </div>

            {/* Section 2: Cards 4, 5, 6 - grid-cols-4 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(250px,auto)]">
              {/* Card 4 - col-span-4 (wide full) */}
              <Suspense
                fallback={
                  <div className="md:col-span-4 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:col-span-4">
                  <ServiceCard3D
                    service={SERVICES[3]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={3}
                    isLarge={false}
                  />
                </div>
              </Suspense>

              {/* Card 5 - col-span-2 */}
              <Suspense
                fallback={
                  <div className="md:col-span-2 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:col-span-2">
                  <ServiceCard3D
                    service={SERVICES[4]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={4}
                    isLarge={false}
                  />
                </div>
              </Suspense>

              {/* Card 6 - col-span-2 */}
              <Suspense
                fallback={
                  <div className="md:col-span-2 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:col-span-2">
                  <ServiceCard3D
                    service={SERVICES[5]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={5}
                    isLarge={false}
                  />
                </div>
              </Suspense>
            </div>

            {/* Section 3: Cards 7, 8, 9 - grid-cols-2 grid-rows-4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-4 gap-6 auto-rows-[minmax(150px,auto)]">
              {/* Card 7 - row-span-2 (top left) */}
              <Suspense
                fallback={
                  <div className="md:row-span-2 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:row-span-2">
                  <ServiceCard3D
                    service={SERVICES[6]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={6}
                    isLarge={false}
                  />
                </div>
              </Suspense>

              {/* Card 9 - row-span-4 (tall right) */}
              <Suspense
                fallback={
                  <div className="md:row-span-4 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:row-span-4">
                  <ServiceCard3D
                    service={SERVICES[8]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={8}
                    isLarge={true}
                  />
                </div>
              </Suspense>

              {/* Card 8 - row-span-2 (bottom left) */}
              <Suspense
                fallback={
                  <div className="md:row-span-2 card flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 border-4 border-kine-600 border-t-transparent rounded-full"
                    />
                  </div>
                }
              >
                <div className="md:row-span-2">
                  <ServiceCard3D
                    service={SERVICES[7]}
                    currentLang={currentLang}
                    onBook={handleBookService}
                    index={7}
                    isLarge={false}
                  />
                </div>
              </Suspense>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <ContactForm />

      {/* CTA Section */}
      <section className="py-20 bg-kine-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-xl mb-8 text-kine-100">
            {t('home.ctaSubtitle')}
          </p>
          <Link to="/book" className="btn bg-white text-kine-700 hover:bg-gray-100 text-lg px-8 py-3">
            {t('home.ctaButton')}
          </Link>
        </div>
      </section>

      
    </div>
  );
}
