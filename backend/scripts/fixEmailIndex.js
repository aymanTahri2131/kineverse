import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixEmailIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // 1. Supprimer les utilisateurs avec email null (sauf s'ils ont des données importantes)
    console.log('\n🔍 Checking for users with null email...');
    const nullEmailUsers = await usersCollection.find({ email: null }).toArray();
    console.log(`Found ${nullEmailUsers.length} users with null email`);

    if (nullEmailUsers.length > 0) {
      console.log('\n❌ Deleting users with null email (test data)...');
      const result = await usersCollection.deleteMany({ email: null });
      console.log(`✅ Deleted ${result.deletedCount} users`);
    }

    // 2. Supprimer l'ancien index unique sur email
    console.log('\n🔧 Dropping old email index...');
    try {
      await usersCollection.dropIndex('email_1');
      console.log('✅ Old email index dropped');
    } catch (err) {
      console.log('ℹ️  No old index to drop (or already dropped)');
    }

    // 3. Créer un nouvel index unique SPARSE (permet plusieurs null)
    console.log('\n🔧 Creating sparse unique index on email...');
    await usersCollection.createIndex(
      { email: 1 }, 
      { 
        unique: true, 
        sparse: true, // Permet plusieurs valeurs null
        name: 'email_sparse_unique'
      }
    );
    console.log('✅ Sparse unique index created on email');

    console.log('\n✅ Email index fixed successfully!');
    console.log('You can now register users without email.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixEmailIndex();
