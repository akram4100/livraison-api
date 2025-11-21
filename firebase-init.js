// firebase-init.js - FIXED VERSION
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

// التهيئة - نفس الإعدادات
const firebaseConfig = {
  apiKey: "AIzaSyB2gSvCF-b2uAZM9j-EQAYs6UKjbRmuxrM",
  authDomain: "livraison-express-f48c3.firebaseapp.com",
  projectId: "livraison-express-f48c3",
  storageBucket: "livraison-express-f48c3.firebasestorage.app",
  messagingSenderId: "1077573560587",
  appId: "1:1077573560587:web:c1a1ffb4cd36f60d605a0e"
};

// ✅ تهيئة Firebase مع التحقق من التكرار
const existingApps = getApps();
const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
const db = getFirestore(app);

console.log('🔥 Firebase initialized for data seeding');

// دالة لإضافة المستخدمين
const addSampleUsers = async () => {
  const users = [
    {
      nom: "Akram",
      email: "aarabic147@gmail.com",
      role: "client",
      verified: true,
      date_creation: Timestamp.now(),
      mot_de_passe: "$2b$10$tIKuypr0OnAZQmqwSE.jau7AmS761q/twFKL43Al4xSOWni9riCFi", // test123
      telephone: "+213550000000",
      ville: "Alger",
      reset_code: null,
      reset_expires: null
    },
    {
      nom: "fodil", 
      email: "akramchabouni00@gmail.com",
      role: "client",
      verified: true, 
      date_creation: Timestamp.now(),
      mot_de_passe: "$2b$10$6L7eGrJ7WufRtUEZoGBtmuqxUUxIf8MVY7.w/dyVNvPnsoj9y2dsW", // test123
      telephone: "+213551111111",
      ville: "Oran",
      reset_code: null,
      reset_expires: null
    },
    {
      nom: "Admin System",
      email: "admin@livraison.com",
      role: "admin",
      verified: true,
      date_creation: Timestamp.now(),
      mot_de_passe: "$2b$10$adminhashedpassword123456789012", // admin123
      telephone: "+213552222222",
      ville: "Alger",
      reset_code: null,
      reset_expires: null
    },
    // ✅ إضافة مستخدم للاختبار
    {
      nom: "Test User",
      email: "akramaxpo@gmail.com",
      role: "client",
      verified: true,
      date_creation: Timestamp.now(),
      mot_de_passe: "$2b$10$tIKuypr0OnAZQmqwSE.jau7AmS761q/twFKL43Al4xSOWni9riCFi", // test123
      telephone: "+213553333333",
      ville: "Alger",
      reset_code: null,
      reset_expires: null
    }
  ];

  try {
    for (const user of users) {
      await setDoc(doc(db, "utilisateurs", user.email), user);
      console.log(`✅ ${user.nom} (${user.email}) added successfully`);
    }
    console.log('🎉 All users added!');
  } catch (error) {
    console.error('❌ Error adding users:', error.message);
  }
};

// دالة لإضافة السائقين
const addSampleDrivers = async () => {
  const drivers = [
    {
      id: "driver1",
      nom: "Ahmed Benali",
      email: "ahmed@livraison.com",
      telephone: "+213661234567",
      statut: "actif",
      vehicule: "Moto",
      plaque: "DZ-16-12345",
      note_moyenne: 4.5,
      date_creation: Timestamp.now()
    },
    {
      id: "driver2",
      nom: "Yasmine Mekki",
      email: "yasmine@livraison.com", 
      telephone: "+213669876543",
      statut: "actif",
      vehicule: "Voiture",
      plaque: "DZ-31-54321",
      note_moyenne: 4.8,
      date_creation: Timestamp.now()
    }
  ];

  try {
    for (const driver of drivers) {
      await setDoc(doc(db, "livreurs", driver.id), driver);
      console.log(`✅ Driver ${driver.nom} added`);
    }
    console.log('🎉 All drivers added!');
  } catch (error) {
    console.error('❌ Error adding drivers:', error.message);
  }
};

// دالة لإضافة الطلبات
const addSampleOrders = async () => {
  const orders = [
    {
      id: "ORDER_001",
      id_client: "aarabic147@gmail.com",
      description: "Colis alimentaire - Fruits et légumes frais",
      statut: "livré",
      date_creation: Timestamp.fromDate(new Date("2024-01-20")),
      livreur: "driver1",
      montant: 120,
      adresse: "123 Rue Didouche Mourad, Alger Centre",
      ville: "Alger"
    },
    {
      id: "ORDER_002",
      id_client: "akramaxpo@gmail.com", // ✅ استخدام البريد الذي تحاول الدخول به
      description: "Documents importants", 
      statut: "en_cours",
      date_creation: Timestamp.now(),
      livreur: "driver2",
      montant: 85,
      adresse: "456 Boulevard de la Soummam, Oran",
      ville: "Oran"
    }
  ];

  try {
    for (const order of orders) {
      await setDoc(doc(db, "commandes", order.id), order);
      console.log(`✅ Order ${order.id} for ${order.id_client} added`);
    }
    console.log('🎉 All orders added!');
  } catch (error) {
    console.error('❌ Error adding orders:', error.message);
  }
};

// دالة لإضافة pending verifications
const addPendingVerifications = async () => {
  const pendingUsers = [
    {
      id: "pending_001",
      nom: "Nouveau Client Test",
      email: "newuser@example.com",
      mot_de_passe: "$2b$10$testhashedpassword123456789012",
      role: "client",
      code_verification: "123456",
      date_creation: Timestamp.now(),
      expiration: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000))
    }
  ];

  try {
    for (const user of pendingUsers) {
      await setDoc(doc(db, "pending_verifications", user.id), user);
      console.log(`✅ Pending verification ${user.email} added`);
    }
    console.log('🎉 All pending verifications added!');
  } catch (error) {
    console.error('❌ Error adding pending verifications:', error.message);
  }
};

// الدالة الرئيسية
const initializeDatabase = async () => {
  console.log('🚀 Starting Firebase database initialization...');
  
  try {
    console.log('📝 Seeding sample data...');
    
    await addSampleUsers();
    await addSampleDrivers();
    await addSampleOrders();
    await addPendingVerifications();
    
    console.log('\n🎉 Firebase database initialization completed successfully!');
    console.log('📊 Data structure created:');
    console.log('   👥 utilisateurs - 4 users (including akramaxpo@gmail.com)');
    console.log('   🚚 livreurs - 2 drivers');
    console.log('   📦 commandes - 2 orders');
    console.log('   📧 pending_verifications - 1 pending user');
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('   Email: akramaxpo@gmail.com');
    console.log('   Password: test123');
    console.log('   Email: admin@livraison.com');
    console.log('   Password: admin123');
    
    console.log('\n✅ You can now test the login functionality!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Initialization failed:', error.message);
    process.exit(1);
  }
};

// تشغيل التهيئة
initializeDatabase();