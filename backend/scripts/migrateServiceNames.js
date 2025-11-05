import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';

dotenv.config();

// Mapping des anciens noms de services vers la structure bilingue
const serviceNameMapping = {
  // Anciens noms français → Nouvelle structure
  'Kinésithérapie du sport': {
    fr: 'Kinésithérapie du sport',
    ar: 'العلاج الطبيعي الرياضي'
  },
  'Kinésithérapie orthopédique': {
    fr: 'Kinésithérapie orthopédique',
    ar: 'العلاج الطبيعي العظمي'
  },
  'Kinésithérapie respiratoire': {
    fr: 'Kinésithérapie respiratoire',
    ar: 'العلاج الطبيعي التنفسي'
  },
  'Massage thérapeutique': {
    fr: 'Massage thérapeutique',
    ar: 'التدليك العلاجي'
  },
  'Rééducation neurologique': {
    fr: 'Rééducation neurologique',
    ar: 'إعادة التأهيل العصبي'
  },
  'Kinésithérapie pédiatrique': {
    fr: 'Kinésithérapie pédiatrique',
    ar: 'العلاج الطبيعي للأطفال'
  },
  
  // Sous-services - Kinésithérapie du sport
  'Préparation physique': {
    fr: 'Préparation physique',
    ar: 'التحضير البدني'
  },
  'Récupération post-effort': {
    fr: 'Récupération post-effort',
    ar: 'التعافي بعد المجهود'
  },
  'Rééducation de blessures sportives': {
    fr: 'Rééducation de blessures sportives',
    ar: 'إعادة تأهيل الإصابات الرياضية'
  },
  'Prévention des blessures': {
    fr: 'Prévention des blessures',
    ar: 'الوقاية من الإصابات'
  },

  // Sous-services - Kinésithérapie orthopédique
  'Rééducation post-fracture': {
    fr: 'Rééducation post-fracture',
    ar: 'إعادة التأهيل بعد الكسر'
  },
  'Rééducation post-opératoire': {
    fr: 'Rééducation post-opératoire',
    ar: 'إعادة التأهيل بعد الجراحة'
  },
  'Traitement des entorses': {
    fr: 'Traitement des entorses',
    ar: 'علاج الالتواءات'
  },
  'Rééducation de l\'épaule': {
    fr: 'Rééducation de l\'épaule',
    ar: 'إعادة تأهيل الكتف'
  },
  'Rééducation du genou': {
    fr: 'Rééducation du genou',
    ar: 'إعادة تأهيل الركبة'
  },

  // Sous-services - Kinésithérapie respiratoire
  'Drainage bronchique': {
    fr: 'Drainage bronchique',
    ar: 'تصريف الشعب الهوائية'
  },
  'Rééducation respiratoire': {
    fr: 'Rééducation respiratoire',
    ar: 'إعادة التأهيل التنفسي'
  },
  'Désencombrement bronchique pédiatrique': {
    fr: 'Désencombrement bronchique pédiatrique',
    ar: 'تنظيف الشعب الهوائية للأطفال'
  },

  // Sous-services - Massage thérapeutique
  'Massage relaxant': {
    fr: 'Massage relaxant',
    ar: 'تدليك الاسترخاء'
  },
  'Massage sportif': {
    fr: 'Massage sportif',
    ar: 'التدليك الرياضي'
  },
  'Massage des tissus profonds': {
    fr: 'Massage des tissus profonds',
    ar: 'تدليك الأنسجة العميقة'
  },
  'Drainage lymphatique': {
    fr: 'Drainage lymphatique',
    ar: 'التصريف اللمفاوي'
  },

  // Sous-services - Rééducation neurologique
  'Rééducation post-AVC': {
    fr: 'Rééducation post-AVC',
    ar: 'إعادة التأهيل بعد السكتة الدماغية'
  },
  'Rééducation de la maladie de Parkinson': {
    fr: 'Rééducation de la maladie de Parkinson',
    ar: 'إعادة تأهيل مرض باركنسون'
  },
  'Rééducation de la sclérose en plaques': {
    fr: 'Rééducation de la sclérose en plaques',
    ar: 'إعادة تأهيل التصلب المتعدد'
  },

  // Sous-services - Kinésithérapie pédiatrique
  'Traitement du torticolis': {
    fr: 'Traitement du torticolis',
    ar: 'علاج صعر الرقبة'
  },
  'Retard de développement moteur': {
    fr: 'Retard de développement moteur',
    ar: 'تأخر النمو الحركي'
  },
  'Rééducation respiratoire pédiatrique': {
    fr: 'Rééducation respiratoire pédiatrique',
    ar: 'إعادة التأهيل التنفسي للأطفال'
  },
  'Plagiocéphalie': {
    fr: 'Plagiocéphalie',
    ar: 'تشوه الجمجمة'
  },

  // Services additionnels (trouvés dans la base)
  'الحجامة الطبية': {
    fr: 'Hijama thérapeutique',
    ar: 'الحجامة الطبية'
  },
  'Hijama thérapeutique': {
    fr: 'Hijama thérapeutique',
    ar: 'الحجامة الطبية'
  },
  'Rééducation en traumatologie': {
    fr: 'Rééducation en traumatologie',
    ar: 'إعادة التأهيل في علم الصدمات'
  },
  'الترويض و التاهيل الطبي لامراض الجهاز التفسي': {
    fr: 'Kinésithérapie respiratoire',
    ar: 'الترويض و التاهيل الطبي لامراض الجهاز التفسي'
  }
};

const migrateServiceNames = async () => {
  try {
    console.log('🔄 Starting service names migration...\n');

    // Connect to MongoDB with timeout options
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all appointments
    const appointments = await Appointment.find({});
    console.log(`📋 Found ${appointments.length} appointments to check\n`);

    let migratedCount = 0;
    let alreadyMigratedCount = 0;
    let notFoundCount = 0;

    for (const appointment of appointments) {
      // Check if service is already in bilingual format
      if (typeof appointment.service === 'object' && appointment.service.fr && appointment.service.ar) {
        alreadyMigratedCount++;
        console.log(`⏭️  Appointment ${appointment._id} - Already migrated`);
        continue;
      }

      // If service is a string, migrate it
      if (typeof appointment.service === 'string') {
        const oldServiceName = appointment.service;
        const newServiceName = serviceNameMapping[oldServiceName];

        if (newServiceName) {
          appointment.service = newServiceName;
          await appointment.save();
          migratedCount++;
          console.log(`✅ Migrated: "${oldServiceName}" → {fr: "${newServiceName.fr}", ar: "${newServiceName.ar}"}`);
        } else {
          notFoundCount++;
          console.log(`⚠️  Warning: No mapping found for "${oldServiceName}" (Appointment ID: ${appointment._id})`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successfully migrated: ${migratedCount} appointments`);
    console.log(`⏭️  Already migrated: ${alreadyMigratedCount} appointments`);
    console.log(`⚠️  Not found in mapping: ${notFoundCount} appointments`);
    console.log(`📋 Total appointments: ${appointments.length}`);
    console.log('='.repeat(80) + '\n');

    if (notFoundCount > 0) {
      console.log('⚠️  Please check the appointments with unmapped service names and add them to the mapping.\n');
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
};

migrateServiceNames();
