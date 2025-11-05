import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Service from '../models/Service.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin KinéVerse',
      email: 'admin@kineverse.com',
      phone: '+212600000000',
      passwordHash: 'Admin123!',
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Admin user created:', admin.email);

    // Create kines
    const kines = await User.create([
      {
        name: 'Dr. Sarah Benali',
        email: 'sarah@kineverse.com',
        phone: '+212600000001',
        passwordHash: 'Kine123!',
        role: 'kine',
        specialty: 'Kinésithérapie du sport',
        bio: 'Spécialiste en rééducation sportive avec 10 ans d\'expérience.',
      },
      {
        name: 'Dr. Mohammed Alami',
        email: 'mohammed@kineverse.com',
        phone: '+212600000002',
        passwordHash: 'Kine123!',
        role: 'kine',
        specialty: 'Kinésithérapie orthopédique',
        bio: 'Expert en rééducation post-opératoire et traumatologie.',
      },
      {
        name: 'Dr. Fatima Zahra',
        email: 'fatima@kineverse.com',
        phone: '+212600000003',
        passwordHash: 'Kine123!',
        role: 'kine',
        specialty: 'Kinésithérapie pédiatrique',
        bio: 'Spécialisée dans la rééducation des enfants et nourrissons.',
      },
    ]);
    console.log('✅ Kine users created');

    // Create patient
    const patient = await User.create({
      name: 'Patient Test',
      email: 'patient@test.com',
      phone: '+212600000010',
      passwordHash: 'Patient123!',
      role: 'patient',
    });
    console.log('✅ Patient user created');

    // Create services
    const services = await Service.create([
      {
        name: 'Kinésithérapie du sport',
        description: 'Rééducation et prévention des blessures sportives',
        subservices: [
          'Préparation physique',
          'Récupération post-effort',
          'Rééducation de blessures sportives',
          'Prévention des blessures',
        ],
        price: 250,
        durationMinutes: 45,
        icon: '⚽',
      },
      {
        name: 'Kinésithérapie orthopédique',
        description: 'Traitement des pathologies ostéo-articulaires',
        subservices: [
          'Rééducation post-fracture',
          'Rééducation post-opératoire',
          'Traitement des entorses',
          'Rééducation de l\'épaule',
          'Rééducation du genou',
        ],
        price: 300,
        durationMinutes: 60,
        icon: '🦴',
      },
      {
        name: 'Kinésithérapie respiratoire',
        description: 'Amélioration de la fonction respiratoire',
        subservices: [
          'Drainage bronchique',
          'Rééducation respiratoire',
          'Désencombrement bronchique pédiatrique',
        ],
        price: 200,
        durationMinutes: 30,
        icon: '🫁',
      },
      {
        name: 'Massage thérapeutique',
        description: 'Massage pour soulager les douleurs musculaires',
        subservices: [
          'Massage relaxant',
          'Massage sportif',
          'Massage des tissus profonds',
          'Drainage lymphatique',
        ],
        price: 180,
        durationMinutes: 45,
        icon: '💆',
      },
      {
        name: 'Rééducation neurologique',
        description: 'Traitement des pathologies neurologiques',
        subservices: [
          'Rééducation post-AVC',
          'Rééducation de la maladie de Parkinson',
          'Rééducation de la sclérose en plaques',
        ],
        price: 350,
        durationMinutes: 60,
        icon: '🧠',
      },
      {
        name: 'Kinésithérapie pédiatrique',
        description: 'Soins adaptés aux enfants et nourrissons',
        subservices: [
          'Traitement du torticolis',
          'Retard de développement moteur',
          'Rééducation respiratoire pédiatrique',
          'Plagiocéphalie',
        ],
        price: 220,
        durationMinutes: 45,
        icon: '👶',
      },
    ]);
    console.log('✅ Services created');

    console.log('\n📊 Database seeded successfully!');
    console.log('\n🔐 Login credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@kineverse.com');
    console.log('  Password: Admin123!');
    console.log('\nKine 1:');
    console.log('  Email: sarah@kineverse.com');
    console.log('  Password: Kine123!');
    console.log('\nKine 2:');
    console.log('  Email: mohammed@kineverse.com');
    console.log('  Password: Kine123!');
    console.log('\nKine 3:');
    console.log('  Email: fatima@kineverse.com');
    console.log('  Password: Kine123!');
    console.log('\nPatient:');
    console.log('  Email: patient@test.com');
    console.log('  Password: Patient123!');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
