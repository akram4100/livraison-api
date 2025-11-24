// firebase-qr-init.cjs - QR System Initialization (CommonJS)
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');

// نفس إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB2gSvCF-b2uAZM9j-EQAYs6UKjbRmuxrM",
  authDomain: "livraison-express-f48c3.firebaseapp.com",
  projectId: "livraison-express-f48c3",
  storageBucket: "livraison-express-f48c3.firebasestorage.app",
  messagingSenderId: "1077573560587",
  appId: "1:1077573560587:web:c1a1ffb4cd36f60d605a0e"
};

// التهيئة
const existingApps = getApps();
const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
const db = getFirestore(app);

console.log('🔥 Firebase initialized for QR System');

// دالة لإنشاء هيكل بيانات QR Sessions
const initializeQRSessions = async () => {
  const sampleSession = {
    id: "demo_qr_session",
    session_id: "qr_demo_" + Date.now(),
    type: "login",
    status: "waiting",
    created_at: Timestamp.now(),
    expires_at: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), // 10 دقائق
    user_data: null,
    mobile_device: null,
    scanned_at: null,
    confirmed_at: null
  };

  try {
    await setDoc(doc(db, "qr_sessions", sampleSession.id), sampleSession);
    console.log('✅ QR Sessions collection initialized successfully!');
    console.log('📋 Sample session created:', sampleSession.session_id);
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing QR sessions:', error.message);
    return false;
  }
};

// تشغيل التهيئة
const setupQRSystem = async () => {
  console.log('🚀 Starting QR System Setup...');
  
  try {
    const success = await initializeQRSessions();
    
    if (success) {
      console.log('\n🎉 QR System Setup Completed!');
      console.log('📊 Next steps:');
      console.log('   1. Add QR endpoints to server-render.js');
      console.log('   2. Update DashboardClient.jsx QR functions');
      console.log('   3. Test QR generation and scanning');
    } else {
      console.log('❌ QR System Setup Failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  }
};

// تشغيل الإعداد
setupQRSystem();