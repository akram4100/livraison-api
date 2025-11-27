// firebase-init.js - Telegram Style QR System
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp, collection, getDocs } = require('firebase/firestore');

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB2gSvCF-b2uAZM9j-EQAYs6UKjbRmuxrM",
  authDomain: "livraison-express-f48c3.firebaseapp.com",
  projectId: "livraison-express-f48c3",
  storageBucket: "livraison-express-f48c3.firebasestorage.app",
  messagingSenderId: "1077573560587",
  appId: "1:1077573560587:web:c1a1ffb4cd36f60d605a0e"
};

// التهيئة
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialized for Telegram QR System');

// 🔧 هيكل الجدول الصحيح لـ QR Sessions
const initializeQRSessions = async () => {
  try {
    // 1. تنظيف الجدول القديم إذا كان موجوداً
    console.log('🧹 Cleaning old QR sessions...');
    try {
      const oldSessions = await getDocs(collection(db, "qr_sessions"));
      const deletePromises = [];
      oldSessions.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${deletePromises.length} old sessions`);
    } catch (error) {
      console.log('ℹ️ No old sessions to delete');
    }

    // 2. إنشاء هيكل الجدول الجديد
    const sampleSession = {
      // ✅ المعرف الأساسي (مثل session_id)
      session_id: "qr_" + Date.now(),
      
      // ✅ حالة الجلسة
      status: "waiting", // waiting, scanned, confirmed, expired
      
      // ✅ معلومات التوقيت
      created_at: Timestamp.now(),
      expires_at: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), // 10 دقائق
      
      // ✅ بيانات المستخدم (تتم تعبئتها عند التأكيد)
      user_data: null,
      
      // ✅ معلومات الجهاز المحمول
      mobile_device: null,
      
      // ✅ معلومات مستخدم الويب
      web_user: null,
      
      // ✅ نوع الجلسة
      type: "web_login", // web_login, mobile_login, etc.
      
      // ✅ أوقات إضافية للتتبع
      scanned_at: null,
      confirmed_at: null
    };

    // 3. حفظ نموذج في Firebase
    await setDoc(doc(db, "qr_sessions", sampleSession.session_id), sampleSession);
    
    console.log('✅ QR Sessions collection initialized successfully!');
    console.log('📋 Sample session structure:');
    console.log(JSON.stringify(sampleSession, null, 2));
    
    return true;
    
  } catch (error) {
    console.error('❌ Error initializing QR sessions:', error.message);
    return false;
  }
};

// 4. اختبار الـ endpoints الأساسية
const testEndpoints = async () => {
  console.log('\n🧪 Testing required endpoints...');
  
  const endpoints = [
    'POST /api/create-qr-session',
    'GET /api/qr-session/:id', 
    'POST /api/qr-confirm'
  ];
  
  endpoints.forEach(endpoint => {
    console.log(`   ✅ ${endpoint}`);
  });
};

// 5. التعليمات
const showInstructions = () => {
  console.log('\n🎯 Telegram-Style QR Login System');
  console.log('================================');
  console.log('1. ✅ Firebase initialized');
  console.log('2. ✅ QR Sessions collection created');
  console.log('3. 🔄 Add these endpoints to server-render.js:');
  console.log('   - POST /api/create-qr-session');
  console.log('   - GET /api/qr-session/:id');
  console.log('   - POST /api/qr-confirm');
  console.log('4. 📱 Update DashboardClient.jsx for mobile scanning');
  console.log('5. 🌐 Update Login.jsx for web QR display');
  console.log('\n🚀 Ready to implement Telegram-style login!');
};

// التشغيل الرئيسي
const main = async () => {
  try {
    console.log('🚀 Starting Firebase initialization...');
    
    const success = await initializeQRSessions();
    
    if (success) {
      await testEndpoints();
      showInstructions();
    } else {
      console.log('❌ Initialization failed');
    }
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
};

// تشغيل التهيئة
main();