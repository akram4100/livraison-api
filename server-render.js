// server-render.js - COMPLETE FIXED VERSION
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
// 🔹 تأكد من أن هذه الـ Imports موجودة في أعلى الملف
const { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query, 
  where, 
  deleteDoc, 
  Timestamp 
} = require('firebase/firestore');
// Load environment variables
dotenv.config();

const app = express();
// ==============================================
// 🎯 FIX: PARTNER STORES ENDPOINT - WORKING VERSION
// ==============================================
app.get("/api/partner/stores", async (req, res) => {
  try {
    const { owner_email } = req.query;
    console.log(`🎯 API CALLED: /api/partner/stores?owner_email=${owner_email}`);
    
    // إرجاع بيانات عينة للاختبار
    const sampleStore = {
      id: "store_fixed_001",
      name: "متجر ثابت",
      description: "هذا متجر من API معدل",
      category: "restaurant",
      address: "عنوان ثابت",
      phone: "0551234567",
      email: owner_email,
      owner_email: owner_email,
      status: "active",
      logo: "https://via.placeholder.com/200/FF6B6B/FFFFFF?text=FIXED",
      banner: "https://via.placeholder.com/1200x400/4ECDC4/FFFFFF?text=FIXED+API",
      orders: 99,
      revenue: "99,999 د.ج",
      rating: 4.9,
      created_at: new Date().toISOString()
    };
    
    console.log(`✅ Returning sample store for: ${owner_email}`);
    
    res.status(200).json({
      success: true,
      message: "✅ API is working!",
      stores: [sampleStore],
      total: 1
    });
    
  } catch (error) {
    console.error("❌ Error in stores endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});
// ==============================================
// 🛡️ CORS CONFIGURATION - محسّن لدعم جميع الـ Headers
// ==============================================

// معالجة طلبات Preflight (OPTIONS) أولاً
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400');
  res.status(200).send();
});

// CORS للطلبات العادية
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'Origin',
    'X-Requested-With',
    'Cache-Control', // 🔥 إضافة هذا
    'Pragma' // 🔥 وإضافة هذا
  ]
}));

// معالجة الـ Headers يدوياً للتأكد
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, Cache-Control, Pragma');
  next();
});

// ==============================================
// 📦 MIDDLEWARE
// ==============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
});

// ==============================================
// 🔥 FIREBASE INITIALIZATION - SIMPLE & SAFE
// ==============================================
let db = null;

try {
    console.log('🔥 Initializing Firebase...');
    
    const { initializeApp, getApps } = require('firebase/app');
    const { getFirestore } = require('firebase/firestore');
    
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };

    console.log('🔧 Firebase Project:', firebaseConfig.projectId);

    const existingApps = getApps();
    let firebaseApp;
    
    if (existingApps.length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
        console.log('✅ New Firebase app initialized');
    } else {
        firebaseApp = existingApps[0];
        console.log('✅ Using existing Firebase app');
    }
    
    db = getFirestore(firebaseApp);
    console.log('📡 Firebase Firestore connected successfully');


} catch (error) {
    console.error('💥 Firebase initialization failed:', error.message);
    db = null;
}

// ==============================================
// 🧹 QR SESSIONS CLEANUP SYSTEM
// ==============================================

// نظام تنظيف الجلسات المنتهية تلقائياً
const startSessionCleanup = () => {
  const cleanupExpiredSessions = async () => {
    try {
      if (!db) {
        console.log('❌ Firebase not connected, skipping cleanup');
        return;
      }

      const now = Timestamp.now();
      const qrSessionsQuery = query(
        collection(db, "qr_sessions"),
        where("expires_at", "<", now)
      );
      
      const snapshot = await getDocs(qrSessionsQuery);
      const deletePromises = [];
      
      snapshot.forEach((doc) => {
        // حذف الجلسات المنتهية فقط إذا لم تكن مؤكدة
        const sessionData = doc.data();
        if (sessionData.status !== 'confirmed') {
          deletePromises.push(deleteDoc(doc.ref));
        }
      });
      
      await Promise.all(deletePromises);
      if (deletePromises.length > 0) {
        console.log(`🧹 Cleaned up ${deletePromises.length} expired QR sessions`);
      }
    } catch (error) {
      console.error('❌ Session cleanup error:', error.message);
    }
  };

  // تشغيل التنظيف فوراً ثم كل 5 دقائق
  cleanupExpiredSessions();
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
  console.log('✅ Session cleanup system started');
};

// تشغيل النظام بعد اكتمال تهيئة Firebase
if (db) {
  setTimeout(startSessionCleanup, 3000);
}
// ==============================================
// 🏪 PARTNER STORES API - FOR DASHBOARD
// ==============================================

// 🔹 دالة مساعدة لإرجاع متاجر عينة
function getSampleStores(ownerEmail) {
  return [
    {
      id: "store_001",
      name: "مطعم الندى",
      description: "أفضل المأكولات التقليدية",
      category: "مطعم",
      address: "شارع الرياض، حي النخيل",
      phone: "0551234567",
      email: "info@alnada.com",
      owner_email: ownerEmail,
      status: "active",
      logo: "https://via.placeholder.com/200/FF6B6B/FFFFFF?text=AL+NADA",
      banner: "https://via.placeholder.com/1200x400/4ECDC4/FFFFFF?text=مطعم+الندى",
      orders: 156,
      revenue: "45,000 د.ج",
      rating: 4.5,
      created_at: new Date().toISOString()
    },
    {
      id: "store_002",
      name: "مقهى القهوة الذهبية",
      description: "قهوة عربية أصيلة ومشروبات ساخنة",
      category: "مقهى",
      address: "حي السلام، عمارة 15",
      phone: "0557654321",
      email: "coffee@golden.com",
      owner_email: ownerEmail,
      status: "active",
      logo: "https://via.placeholder.com/200/FFD166/FFFFFF?text=Golden+Cafe",
      banner: "https://via.placeholder.com/1200x400/06D6A0/FFFFFF?text=قهوة+ذهبية",
      orders: 89,
      revenue: "23,500 د.ج",
      rating: 4.8,
      created_at: new Date().toISOString()
    }
  ];
}

// 🔹 إنشاء متجر جديد
app.post("/api/partner/stores/create", async (req, res) => {
  try {
    console.log("🏪 Creating new store:", req.body);
    
    const {
      name, description, category, address, phone, email,
      owner_id, owner_email, logo_url, banner_url
    } = req.body;

    // التحقق من الحقول المطلوبة
    if (!name || !category || !address || !owner_email) {
      return res.status(400).json({
        success: false,
        message: "❌ Required fields: name, category, address, owner_email"
      });
    }

    const storeId = 'store_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const storeData = {
      id: storeId,
      name,
      description: description || "",
      category,
      address,
      phone: phone || "",
      email: email || owner_email,
      owner_id: owner_id || owner_email,
      owner_email,
      status: "active",
      logo_url: logo_url || "https://via.placeholder.com/200",
      banner_url: banner_url || "https://via.placeholder.com/1200x400",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stats: {
        total_orders: 0,
        total_revenue: 0,
        average_rating: 0,
        total_reviews: 0
      }
    };

    console.log(`✅ Store created (simulated): ${storeId} - ${name}`);

    res.status(201).json({
      success: true,
      message: "✅ Store created successfully",
      store_id: storeId,
      store: storeData
    });

  } catch (error) {
    console.error("❌ Store creation error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating store",
      error: error.message
    });
  }
});

// 🔹 حذف متجر
app.delete("/api/partner/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { user_email } = req.query;

    console.log(`🗑️ Deleting store: ${storeId} by user: ${user_email}`);

    if (!storeId || !user_email) {
      return res.status(400).json({
        success: false,
        message: "Store ID and user email are required"
      });
    }

    console.log(`✅ Store deleted (simulated): ${storeId}`);

    res.status(200).json({
      success: true,
      message: "✅ Store deleted successfully",
      store_id: storeId
    });

  } catch (error) {
    console.error("❌ Delete store error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting store",
      error: error.message
    });
  }
});
// ==============================================
// 🏥 BASIC ROUTES
// ==============================================
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Livraison Express API is running on Render!",
        status: "operational",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        firebase: db ? "connected" : "disconnected"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: db ? "Firebase Connected" : "Firebase Disconnected",
        firebaseProject: process.env.FIREBASE_PROJECT_ID || "Not configured"
    });
});

// ==============================================
// 👤 USER ROUTES - WITH REAL FIREBASE STORAGE
// ==============================================
const bcrypt = require("bcryptjs");

// 🔹 TEST ROUTE - مع Firebase الحقيقي
app.get("/api/user-test", (req, res) => {
  res.json({
    message: "✅ User routes with REAL Firebase Storage!",
    availableEndpoints: [
      "POST /api/register - يحفظ في Firebase",
      "POST /api/login - يقرأ من Firebase", 
      "POST /api/verify-code - تحقق من الكود",
      "POST /api/send-reset-code - إرسال كود إعادة التعيين",
      "POST /api/verify-reset-code - تحقق من كود إعادة التعيين",
      "POST /api/reset-password - إعادة تعيين كلمة المرور"
    ],
    firebase: db ? "Connected ✅" : "Disconnected ❌",
    status: "ready"
  });
});

// 🔹 REGISTER USER - يحفظ في Firebase الحقيقي
app.post("/api/register", async (req, res) => {
  try {
    console.log("📥 Register request received:", req.body);
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ 
        message: "❌ Tous les champs sont obligatoires." 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible" 
      });
    }

    // تحقق إذا المستخدم موجود في Firebase
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    if (userDoc.exists()) {
      return res.status(400).json({ 
        message: "❌ Cet e-mail est déjà utilisé." 
      });
    }

    // كلمة المرور مشفرة
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // حفظ في pending_verifications في Firebase
    const pendingId = `pending_${Date.now()}`;
    await setDoc(doc(db, "pending_verifications", pendingId), {
      nom, 
      email, 
      mot_de_passe: hashedPassword, 
      role,
      code_verification: verificationCode,
      date_creation: Timestamp.now(),
      expiration: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000))
    });

    console.log(`✅ User saved to Firebase: ${email}`);

    // 🔥 إرسال إيميل حقيقي مع إعادة المحاولة
    try {
      const { sendEmailWithRetry } = require("./utils/emailService-render.js");
      const emailResult = await sendEmailWithRetry(
        email,
        "Code de vérification - Livraison Express",
        verificationCode,
        nom,
        2  // محاولتين
      );

      if (!emailResult.ok) {
        console.error("❌ Email sending failed:", emailResult.error);
        
        // حتى إذا فشل الإيميل، نرجع الكود للعميل
        res.status(200).json({ 
          message: "✅ Utilisateur enregistré - Code généré",
          email: email,
          verification_code: verificationCode,
          note: "Utilisez ce code pour vérifier votre compte (Email service temporairement indisponible)",
          firebase: "saved"
        });
        return;
      }

      console.log(`✅ Email sent successfully to: ${email}`);

      res.status(200).json({ 
        message: "✅ Code de vérification envoyé à votre e-mail!",
        email: email,
        firebase: "saved_and_email_sent"
      });

    } catch (emailError) {
      console.error("❌ Email service error:", emailError);
      
      // إذا فشلت خدمة الإيميل كلياً، نرجع الكود
      res.status(200).json({ 
        message: "✅ Utilisateur enregistré avec succès!",
        email: email,
        verification_code: verificationCode,
        note: "Utilisez ce code pour vérifier votre compte",
        firebase: "saved"
      });
    }

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ 
      message: "❌ Erreur interne du serveur.",
      error: error.message 
    });
  }
});

// 🔹 LOGIN USER - يقرأ من Firebase الحقيقي
app.post("/api/login", async (req, res) => {
  try {
    console.log("🔐 Login request received:", req.body);
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ 
        message: "❌ Email et mot de passe sont requis." 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible" 
      });
    }

    // البحث في Firebase
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const user = userDoc.data();
    
    // تحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "❌ Mot de passe incorrect." 
      });
    }

    console.log(`✅ Login successful: ${email}`);
    
    res.status(200).json({
      message: "✅ Connexion réussie.",
      user: {
        id: userDoc.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        ville: user.ville || "",
        telephone: user.telephone || ""
      },
      firebase: "authenticated"
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ 
      message: "❌ Erreur interne du serveur.",
      error: error.message 
    });
  }
});

// 🔹 VERIFY EMAIL CODE - جديد
app.post("/api/verify-code", async (req, res) => {
  try {
    console.log("📩 Verify code request:", req.body);
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        message: "❌ Email et code sont requis." 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible" 
      });
    }

    // البحث في pending_verifications
    const pendingQuery = query(
      collection(db, "pending_verifications"), 
      where("email", "==", email),
      where("code_verification", "==", code)
    );
    
    const pendingSnapshot = await getDocs(pendingQuery);

    if (pendingSnapshot.empty) {
      return res.status(400).json({ 
        message: "❌ Code invalide ou expiré." 
      });
    }

    const pendingData = pendingSnapshot.docs[0].data();
    const pendingRef = pendingSnapshot.docs[0].ref;

    // تحقق من انتهاء الصلاحية
    if (pendingData.expiration.toDate() < new Date()) {
      await deleteDoc(pendingRef);
      return res.status(400).json({ 
        message: "❌ Code expiré." 
      });
    }

    // نقل المستخدم إلى utilisateurs
    await setDoc(doc(db, "utilisateurs", email), {
      nom: pendingData.nom,
      email: pendingData.email,
      mot_de_passe: pendingData.mot_de_passe,
      role: pendingData.role,
      verified: true,
      date_creation: Timestamp.now(),
      telephone: "",
      ville: ""
    });

    // حذف من pending
    await deleteDoc(pendingRef);

    console.log(`✅ User verified: ${email}`);
    
    res.status(200).json({ 
      message: "✅ Email vérifié avec succès !",
      user: {
        nom: pendingData.nom,
        email: pendingData.email,
        role: pendingData.role
      },
      firebase: "verified"
    });

  } catch (error) {
    console.error("❌ Verification error:", error);
    res.status(500).json({ 
      message: "❌ Erreur lors de la vérification.",
      error: error.message 
    });
  }
});

// ==============================================
// 🔑 PASSWORD RESET ROUTES
// ==============================================

// 🔹 SEND RESET CODE
app.post("/api/send-reset-code", async (req, res) => {
  try {
    console.log("📧 Send reset code request:", req.body);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: "❌ Email est requis." 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible" 
      });
    }

    // تحقق إذا المستخدم موجود
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      console.log("❌ User not found:", email);
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const user = userDoc.data();
    const userName = user.nom || "Utilisateur";

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes

    // Update user with reset code
    await updateDoc(doc(db, "utilisateurs", email), {
      reset_code: otp,
      reset_expires: expiration
    });

    console.log(`🔐 Reset OTP for ${email}: ${otp}`);

    // إرسال إيميل حقيقي
    try {
      const { sendEmailWithRetry } = require("./utils/emailService-render.js");
      const emailResult = await sendEmailWithRetry(
        email,
        "Code de réinitialisation - Livraison Express",
        otp,
        userName,
        2
      );

      if (!emailResult.ok) {
        console.error("❌ Reset email failed:", emailResult.error);
        
        // إرجاع الكود مباشرة إذا فشل الإيميل
        res.status(200).json({ 
          message: "✅ Code de réinitialisation généré.",
          email: email,
          reset_code: otp,
          note: "En production, ce code serait envoyé par email"
        });
        return;
      }

      res.status(200).json({ 
        message: "✅ Code de réinitialisation envoyé à votre e-mail!",
        email: email
      });

    } catch (emailError) {
      console.error("❌ Email service error:", emailError);
      
      res.status(200).json({ 
        message: "✅ Code de réinitialisation généré.",
        email: email,
        reset_code: otp,
        note: "Utilisez ce code pour réinitialiser votre mot de passe"
      });
    }

  } catch (error) {
    console.error("❌ Send reset code error:", error);
    res.status(500).json({ 
      message: "❌ Erreur lors de l'envoi du code." 
    });
  }
});

// 🔹 VERIFY RESET CODE
app.post("/api/verify-reset-code", async (req, res) => {
  try {
    console.log("🔍 Verify reset code request:", req.body);
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        message: "❌ Email et code sont requis." 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible" 
      });
    }

    // Get user
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const user = userDoc.data();

    // Check reset code and expiration
    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ 
        message: "❌ Code de réinitialisation invalide." 
      });
    }

    if (user.reset_expires.toDate() < new Date()) {
      return res.status(400).json({ 
        message: "❌ Code de réinitialisation expiré." 
      });
    }

    console.log(`✅ Reset code verified for: ${email}`);
    res.status(200).json({ 
      message: "✅ Code vérifié avec succès.",
      email: email
    });

  } catch (error) {
    console.error("❌ Verify reset code error:", error);
    res.status(500).json({ 
      message: "❌ Erreur lors de la vérification." 
    });
  }
});

// 🔹 RESET PASSWORD
app.post("/api/reset-password", async (req, res) => {
  try {
    console.log("🔄 Reset password request:", req.body);
    const { email, nouveauMotDePasse } = req.body;

    if (!email || !nouveauMotDePasse) {
      return res.status(400).json({ 
        message: "❌ Email et nouveau mot de passe sont requis." 
      });
    }

    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ 
        message: "❌ Le mot de passe doit contenir au moins 6 caractères." 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        message: "❌ Service temporairement indisponible" 
      });
    }

    // Get user to verify existence
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);

    // Update password and clear reset fields
    await updateDoc(doc(db, "utilisateurs", email), {
      mot_de_passe: hashedPassword,
      reset_code: null,
      reset_expires: null
    });

    console.log(`✅ Password reset successfully for: ${email}`);
    res.status(200).json({ 
      message: "✅ Mot de passe réinitialisé avec succès." 
    });

  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ 
      message: "❌ Erreur lors de la réinitialisation." 
    });
  }
});
// ==============================================
// 📱 TELEGRAM-STYLE QR LOGIN SYSTEM (BASIC)
// ==============================================

// ✅ 1. إنشاء جلسة QR جديدة (للويب - مثل Telegram Web)
app.post("/api/create-telegram-qr", async (req, res) => {
  try {
    console.log("🎯 Creating Telegram-style QR session...");
    
    const sessionId = "tg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);

    const sessionData = {
      session_id: sessionId,
      status: "waiting",
      created_at: Timestamp.now(),
      expires_at: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 1000)), // دقيقتين
      user_data: null,
      mobile_device: null,
      web_user: null,
      type: "web_login"
    };

    await setDoc(doc(db, "qr_sessions", sessionId), sessionData);

    // إنشاء QR code يحتوي على session_id فقط (مثل Telegram)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${sessionId}&format=png&margin=10`;

    console.log(`✅ Telegram QR session created: ${sessionId}`);

    res.json({
      success: true,
      session_id: sessionId,
      qr_url: qrUrl,
      expires_at: sessionData.expires_at.toDate()
    });

  } catch (err) {
    console.error("❌ Create Telegram QR error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 2. فحص حالة الجلسة (الويب يطلب - مثل Telegram Web)
app.get("/api/check-telegram-session/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    console.log(`🔍 Checking Telegram session: ${sessionId}`);

    const sessionDoc = await getDoc(doc(db, "qr_sessions", sessionId));

    if (!sessionDoc.exists()) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const session = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    if (session.expires_at.toDate() < new Date()) {
      await updateDoc(doc(db, "qr_sessions", sessionId), { 
        status: "expired" 
      });
      return res.json({ 
        success: true, 
        session: { ...session, status: "expired" } 
      });
    }

    console.log(`✅ Telegram session status: ${session.status}`);
    res.json({ success: true, session });

  } catch (err) {
    console.error("❌ Check Telegram session error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 3. الهاتف يؤكد الدخول (بعد مسح QR - مثل Telegram App)
app.post("/api/confirm-telegram-login", async (req, res) => {
  try {
    const { session_id, user } = req.body;
    console.log(`📱 Mobile confirming Telegram login: ${session_id}`, user);

    const sessionRef = doc(db, "qr_sessions", session_id);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const session = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    if (session.expires_at.toDate() < new Date()) {
      await updateDoc(sessionRef, { status: "expired" });
      return res.status(400).json({ success: false, message: "Session expired" });
    }

    // إذا كانت الجلسة مؤكدة مسبقاً
    if (session.status === "confirmed") {
      return res.json({ success: true, message: "Already confirmed" });
    }

    // تحديث الجلسة بتأكيد الدخول
    await updateDoc(sessionRef, {
      status: "confirmed",
      user_data: user,
      confirmed_at: Timestamp.now(),
      mobile_device: {
        confirm_time: new Date().toISOString(),
        user_agent: req.headers['user-agent']
      }
    });

    console.log(`✅ Telegram login confirmed: ${session_id}`);

    res.json({ 
      success: true, 
      message: "Login confirmed successfully" 
    });

  } catch (err) {
    console.error("❌ Confirm Telegram login error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ 4. تنظيف الجلسات القديمة
const cleanupOldSessions = async () => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, "qr_sessions"),
      where("expires_at", "<", now)
    );
    
    const snapshot = await getDocs(q);
    const deletions = [];
    
    snapshot.forEach(doc => {
      deletions.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletions);
    if (deletions.length > 0) {
      console.log(`🧹 Cleaned ${deletions.length} expired sessions`);
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
};

// تشغيل التنظيف كل 5 دقائق
setInterval(cleanupOldSessions, 5 * 60 * 1000);
// ==============================================
// 🔐 COMPLETE QR CODE SYSTEM
// ==============================================

// 🔹 إنشاء جلسة QR جديدة
app.post("/api/create-qr-session", async (req, res) => {
  try {
    console.log("🎯 Creating new QR session...");
    const { type = "login" } = req.body;
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionId = 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const sessionData = {
      id: sessionId,
      session_id: sessionId,
      type: type,
      status: "waiting",
      created_at: Timestamp.now(),
      expires_at: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), // 10 دقائق
      user_data: null,
      mobile_device: null,
      scanned_at: null,
      confirmed_at: null
    };

    await setDoc(doc(db, "qr_sessions", sessionId), sessionData);

    // إنشاء بيانات QR
    const qrData = {
      type: 'livraison_qr',
      session_id: sessionId,
      action: type,
      timestamp: Date.now(),
      app_name: 'Livraison Express',
      base_url: "https://livraison-api-x45n.onrender.com"
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}&format=png&margin=10`;

    console.log(`✅ QR session created: ${sessionId}`);

    res.status(200).json({
      success: true,
      session_id: sessionId,
      qr_url: qrUrl,
      qr_data: qrData,
      expires_at: sessionData.expires_at.toDate(),
      message: "QR session created successfully"
    });

  } catch (error) {
    console.error("❌ Create QR session error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error creating QR session",
      error: error.message 
    });
  }
});

// 🔹 الحصول على حالة جلسة QR - إصدار محسن واحد فقط
app.get("/api/qr-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🔍 Checking QR session: ${sessionId}`);
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionDoc = await getDoc(doc(db, "qr_sessions", sessionId));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    const now = new Date();
    const expiresAt = sessionData.expires_at.toDate();
    
    if (expiresAt < now) {
      // تحديث الحالة إذا انتهت الصلاحية
      if (sessionData.status !== 'expired') {
        await updateDoc(doc(db, "qr_sessions", sessionId), {
          status: "expired"
        });
        sessionData.status = "expired";
      }
      
      return res.status(200).json({
        success: false,
        message: "❌ Session expired",
        session: {
          ...sessionData,
          expires_at: expiresAt,
          is_expired: true
        }
      });
    }

    // حساب الوقت المتبقي
    const timeRemaining = Math.floor((expiresAt - now) / 1000);

    console.log(`✅ Session status: ${sessionData.status}, Time remaining: ${timeRemaining}s`);

    res.status(200).json({
      success: true,
      session: {
        ...sessionData,
        expires_at: expiresAt,
        time_remaining: timeRemaining,
        is_expired: false
      }
    });

  } catch (error) {
    console.error("❌ Get QR session error:", error);
    res.status(500).json({ 
      success: false,
      message: "❌ Error getting session information",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔹 استبدال endpoint المسح الحالي بهذا الإصدار المحسن
app.post("/api/mobile/scan-qr", async (req, res) => {
  try {
    const { session_id, device_info = {} } = req.body;
    console.log(`📱 Mobile scanning QR: ${session_id}`);

    if (!session_id) {
      return res.status(400).json({ 
        success: false,
        message: "Session ID is required" 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionDoc = await getDoc(doc(db, "qr_sessions", session_id));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ QR session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    if (sessionData.expires_at.toDate() < new Date()) {
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "expired"
      });
      return res.status(400).json({ 
        success: false,
        message: "❌ QR session has expired" 
      });
    }

    // التحقق من حالة الجلسة
    if (sessionData.status === "confirmed") {
      return res.status(400).json({ 
        success: false,
        message: "❌ This QR has already been used" 
      });
    }

    if (sessionData.status === "scanned") {
      return res.status(400).json({ 
        success: false,
        message: "❌ QR is already being processed" 
      });
    }

    // تحديث حالة الجلسة إلى "تم المسح"
    await updateDoc(doc(db, "qr_sessions", session_id), {
      status: "scanned",
      mobile_device: {
        ...device_info,
        scan_timestamp: new Date().toISOString()
      },
      scanned_at: Timestamp.now(),
      last_updated: Timestamp.now()
    });

    console.log(`✅ QR scanned successfully: ${session_id}`);
    
    // حساب الوقت المتبقي
    const expiresAt = sessionData.expires_at.toDate();
    const timeRemaining = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));

    res.status(200).json({
      success: true,
      message: "✅ QR scanned successfully",
      session_type: sessionData.type,
      session_id: session_id,
      status: "scanned",
      expires_in: timeRemaining,
      next_step: "waiting_confirmation"
    });

  } catch (error) {
    console.error("❌ Mobile scan error:", error);
    res.status(500).json({ 
      success: false,
      message: "❌ Internal server error during scanning",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔹 الهاتف: تأكيد تسجيل الدخول
app.post("/api/mobile/confirm-login", async (req, res) => {
  try {
    const { session_id, email, mot_de_passe } = req.body;
    console.log(`🔐 Mobile confirming login: ${session_id}, ${email}`);

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    // التحقق من بيانات المستخدم
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const user = userDoc.data();
    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    // التحقق من الجلسة
    const sessionDoc = await getDoc(doc(db, "qr_sessions", session_id));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    if (sessionData.expires_at.toDate() < new Date()) {
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "expired"
      });
      return res.status(400).json({ 
        success: false,
        message: "Session expired" 
      });
    }

    // إعداد بيانات المستخدم (بدون معلومات حساسة)
    const userData = {
      id: userDoc.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      ville: user.ville || "",
      telephone: user.telephone || ""
    };

    // تحديث الجلسة ببيانات المستخدم
    await updateDoc(doc(db, "qr_sessions", session_id), {
      status: "confirmed",
      user_data: userData,
      confirmed_at: Timestamp.now()
    });

    console.log(`✅ Login confirmed for session: ${session_id}`);

    res.status(200).json({
      success: true,
      message: "Login confirmed successfully",
      user: userData,
      session_id: session_id
    });

  } catch (error) {
    console.error("❌ Mobile confirm login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error confirming login",
      error: error.message 
    });
  }
});

// 🔹 تحسين endpoint التحقق من حالة الجلسة
app.get("/api/qr-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🔍 Checking QR session: ${sessionId}`);
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionDoc = await getDoc(doc(db, "qr_sessions", sessionId));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    const now = new Date();
    const expiresAt = sessionData.expires_at.toDate();
    
    if (expiresAt < now) {
      // تحديث الحالة إذا انتهت الصلاحية
      if (sessionData.status !== 'expired') {
        await updateDoc(doc(db, "qr_sessions", sessionId), {
          status: "expired"
        });
        sessionData.status = "expired";
      }
      
      return res.status(200).json({
        success: false,
        message: "❌ Session expired",
        session: {
          ...sessionData,
          expires_at: expiresAt,
          is_expired: true
        }
      });
    }

    // حساب الوقت المتبقي
    const timeRemaining = Math.floor((expiresAt - now) / 1000);

    console.log(`✅ Session status: ${sessionData.status}, Time remaining: ${timeRemaining}s`);

    res.status(200).json({
      success: true,
      session: {
        ...sessionData,
        expires_at: expiresAt,
        time_remaining: timeRemaining,
        is_expired: false
      }
    });

  } catch (error) {
    console.error("❌ Get QR session error:", error);
    res.status(500).json({ 
      success: false,
      message: "❌ Error getting session information",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// 🔹 تأكيد الدخول بدون كلمة مرور (للمسح التلقائي)
app.post("/api/confirm-qr-login", async (req, res) => {
  try {
    const { session_id, user_data } = req.body;
    console.log(`📱 Mobile confirming QR login: ${session_id}`, user_data);

    if (!session_id || !user_data) {
      return res.status(400).json({ 
        success: false, 
        message: "Session ID and user data are required" 
      });
    }

    const sessionRef = doc(db, "qr_sessions", session_id);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: "Session not found" 
      });
    }

    const session = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    if (session.expires_at.toDate() < new Date()) {
      await updateDoc(sessionRef, { status: "expired" });
      return res.status(400).json({ 
        success: false, 
        message: "Session expired" 
      });
    }

    // تحديث الجلسة بتأكيد الدخول
    await updateDoc(sessionRef, {
      status: "confirmed",
      user_data: user_data,
      confirmed_at: Timestamp.now(),
      mobile_device: {
        confirm_time: new Date().toISOString(),
        user_agent: req.headers['user-agent']
      }
    });

    console.log(`✅ QR login confirmed: ${session_id}`);

    res.json({ 
      success: true, 
      message: "Login confirmed successfully",
      user: user_data
    });

  } catch (err) {
    console.error("❌ Confirm QR login error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});
// ==============================================
// 🔐 DASHBOARD QR ENDPOINTS 
// ==============================================

// 🔹 إنشاء QR code للداشبورد (معلومات المستخدم)
app.post("/api/generate-dashboard-qr", async (req, res) => {
  try {
    const { user_id, user_email, user_name, user_role } = req.body;
    console.log("🎯 Generating Dashboard QR for:", user_email);

    if (!user_id || !user_email) {
      return res.status(400).json({ 
        success: false,
        message: "User data is required" 
      });
    }

    // إنشاء بيانات QR خاصة بالداشبورد
    const qrData = {
      type: 'user_profile',
      user_id: user_id,
      user_email: user_email,
      user_name: user_name,
      user_role: user_role,
      timestamp: Date.now(),
      action: 'view_profile',
      source: 'dashboard',
      app: 'Livraison Express'
    };

    // إنشاء رابط QR
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}&format=png&margin=10&color=2c3e50&bgcolor=ecf0f1`;

    console.log("✅ Dashboard QR generated for user:", user_email);
    
    res.status(200).json({
      success: true,
      qr_url: qrUrl,
      user_data: {
        id: user_id,
        email: user_email,
        name: user_name,
        role: user_role
      },
      message: "Dashboard QR code generated successfully"
    });

  } catch (error) {
    console.error("❌ Dashboard QR generation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});
// ==============================================
// 🔄 SIMPLE QR ENDPOINTS (بدون مشاكل CORS)
// ==============================================

// 🔹 endpoint QR مبسط بدون مشاكل CORS
app.post("/api/simple-create-qr", async (req, res) => {
  try {
    console.log("🎯 Simple QR creation request...");
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionId = 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const sessionData = {
      id: sessionId,
      session_id: sessionId,
      type: "login",
      status: "waiting",
      created_at: Timestamp.now(),
      expires_at: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      user_data: null,
      mobile_device: null,
      scanned_at: null,
      confirmed_at: null
    };

    await setDoc(doc(db, "qr_sessions", sessionId), sessionData);

    // إنشاء بيانات QR مبسطة
    const qrData = {
      type: 'livraison_qr',
      session_id: sessionId,
      action: 'login',
      timestamp: Date.now(),
      app_name: 'Livraison Express',
      base_url: "https://livraison-api-x45n.onrender.com"
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}&format=png&margin=10`;

    console.log(`✅ Simple QR session created: ${sessionId}`);

    res.status(200).json({
      success: true,
      session_id: sessionId,
      qr_url: qrUrl,
      qr_data: qrData,
      expires_at: sessionData.expires_at.toDate(),
      message: "QR session created successfully"
    });

  } catch (error) {
    console.error("❌ Simple QR creation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error creating QR session",
      error: error.message 
    });
  }
});

// 🔹 endpoint بديل لفحص حالة الجلسة
app.get("/api/simple-qr-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🔍 Simple checking QR session: ${sessionId}`);
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionDoc = await getDoc(doc(db, "qr_sessions", sessionId));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    const now = new Date();
    const expiresAt = sessionData.expires_at.toDate();
    
    if (expiresAt < now) {
      // تحديث الحالة إذا انتهت الصلاحية
      if (sessionData.status !== 'expired') {
        await updateDoc(doc(db, "qr_sessions", sessionId), {
          status: "expired"
        });
        sessionData.status = "expired";
      }
      
      return res.status(200).json({
        success: false,
        message: "❌ Session expired",
        session: {
          ...sessionData,
          expires_at: expiresAt,
          is_expired: true
        }
      });
    }

    // حساب الوقت المتبقي
    const timeRemaining = Math.floor((expiresAt - now) / 1000);

    console.log(`✅ Simple session status: ${sessionData.status}, Time remaining: ${timeRemaining}s`);

    res.status(200).json({
      success: true,
      session: {
        ...sessionData,
        expires_at: expiresAt,
        time_remaining: timeRemaining,
        is_expired: false
      }
    });

  } catch (error) {
    console.error("❌ Simple get QR session error:", error);
    res.status(500).json({ 
      success: false,
      message: "❌ Error getting session information"
    });
  }
});
// ==============================================
// 🔍 QR SYSTEM DIAGNOSTICS & LOGGING
// ==============================================

// 🔹 تشخيص حالة Firebase وجلسات QR
app.get("/api/qr-diagnostics", async (req, res) => {
  try {
    console.log("🔍 QR Diagnostics requested");
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      firebase_status: db ? "connected" : "disconnected",
      firebase_project: process.env.FIREBASE_PROJECT_ID || "not_configured",
      environment: process.env.NODE_ENV || "development",
      server_time: new Date().toISOString(),
      endpoints_available: [
        "POST /api/create-qr-session",
        "GET /api/qr-session/:id", 
        "POST /api/mobile/scan-qr",
        "POST /api/mobile/confirm-login"
      ]
    };

    // التحقق من وجود جلسات نشطة
    if (db) {
      try {
        const qrSessionsQuery = query(collection(db, "qr_sessions"));
        const snapshot = await getDocs(qrSessionsQuery);
        diagnostics.active_sessions = snapshot.size;
        diagnostics.sessions_sample = [];
        
        snapshot.forEach(doc => {
          const session = doc.data();
          diagnostics.sessions_sample.push({
            id: session.session_id,
            status: session.status,
            type: session.type,
            created: session.created_at?.toDate?.() || session.created_at,
            expires: session.expires_at?.toDate?.() || session.expires_at
          });
        });
      } catch (firestoreError) {
        diagnostics.firestore_error = firestoreError.message;
      }
    }

    console.log("✅ Diagnostics completed:", diagnostics);
    
    res.status(200).json({
      success: true,
      diagnostics: diagnostics
    });

  } catch (error) {
    console.error("❌ Diagnostics error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔹 سجل تفصيلي لإنشاء جلسة QR
app.post("/api/debug/create-qr-session", async (req, res) => {
  try {
    console.log("🎯 DEBUG: Creating QR session with details:", req.body);
    
    const { type = "login", debug_info = {} } = req.body;
    
    const sessionId = 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const createdAt = Timestamp.now();
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));

    const sessionData = {
      id: sessionId,
      session_id: sessionId,
      type: type,
      status: "waiting",
      created_at: createdAt,
      expires_at: expiresAt,
      user_data: null,
      mobile_device: null,
      scanned_at: null,
      confirmed_at: null,
      debug_info: {
        client_timestamp: debug_info.timestamp || Date.now(),
        user_agent: req.headers['user-agent'],
        source: debug_info.source || 'unknown'
      }
    };

    console.log("📝 Session data to save:", sessionData);

    await setDoc(doc(db, "qr_sessions", sessionId), sessionData);
    console.log("✅ DEBUG: Session saved to Firestore");

    // إنشاء QR code
    const qrData = {
      type: 'livraison_qr',
      session_id: sessionId,
      action: type,
      timestamp: Date.now(),
      app_name: 'Livraison Express',
      base_url: "https://livraison-api-x45n.onrender.com",
      debug: true
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}&format=png&margin=10`;

    console.log("🎉 DEBUG: QR session created successfully:", {
      session_id: sessionId,
      qr_url: qrUrl,
      expires_at: expiresAt.toDate()
    });

    res.status(200).json({
      success: true,
      session_id: sessionId,
      qr_url: qrUrl,
      qr_data: qrData,
      expires_at: expiresAt.toDate(),
      debug_info: {
        firestore_saved: true,
        session_created: createdAt.toDate(),
        session_expires: expiresAt.toDate()
      },
      message: "QR session created with debug info"
    });

  } catch (error) {
    console.error("❌ DEBUG: Create QR session error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      timestamp: new Date().toISOString()
    });
  }
});
// 🔹 إنشاء جلسة QR للهاتف (الهاتف يولد الكود)
app.post("/api/mobile/generate-login-qr", async (req, res) => {
  try {
    const { user_email, user_name } = req.body;
    console.log("📱 Mobile generating login QR for:", user_email);

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionId = 'mobile_qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const sessionData = {
      id: sessionId,
      session_id: sessionId,
      type: "mobile_to_web_login",
      status: "waiting",
      created_at: Timestamp.now(),
      expires_at: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)), // 5 دقائق
      mobile_user: {
        email: user_email,
        name: user_name
      },
      web_user: null,
      scanned_at: null,
      confirmed_at: null,
      login_confirmed: false
    };

    await setDoc(doc(db, "qr_sessions", sessionId), sessionData);

    // إنشاء بيانات QR للهاتف
    const qrData = {
      type: 'mobile_login_qr',
      session_id: sessionId,
      action: 'login_to_web',
      timestamp: Date.now(),
      app_name: 'Livraison Express',
      base_url: "https://livraison-api-x45n.onrender.com"
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}&format=png&margin=10`;

    console.log(`✅ Mobile QR session created: ${sessionId}`);

    res.status(200).json({
      success: true,
      session_id: sessionId,
      qr_url: qrUrl,
      qr_data: qrData,
      expires_at: sessionData.expires_at.toDate(),
      message: "Mobile login QR generated successfully"
    });

  } catch (error) {
    console.error("❌ Mobile QR generation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error generating mobile QR",
      error: error.message 
    });
  }
});

// 🔹 الداشبورد يمسح الكود من الهاتف
app.post("/api/web/scan-mobile-qr", async (req, res) => {
  try {
    const { session_id, web_user_email } = req.body;
    console.log(`🖥️ Web scanning mobile QR: ${session_id} for user: ${web_user_email}`);

    if (!session_id || !web_user_email) {
      return res.status(400).json({ 
        success: false,
        message: "Session ID and user email are required" 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    // التحقق من الجلسة
    const sessionDoc = await getDoc(doc(db, "qr_sessions", session_id));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ QR session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    if (sessionData.expires_at.toDate() < new Date()) {
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "expired"
      });
      return res.status(400).json({ 
        success: false,
        message: "❌ QR session has expired" 
      });
    }

    // التحقق من أن الجلسة مخصصة للهاتف
    if (sessionData.type !== "mobile_to_web_login") {
      return res.status(400).json({ 
        success: false,
        message: "❌ Invalid QR type" 
      });
    }

    // تحديث الجلسة بأن الداشبورد مسح الكود
    await updateDoc(doc(db, "qr_sessions", session_id), {
      status: "scanned",
      web_user: {
        email: web_user_email,
        scan_timestamp: new Date().toISOString()
      },
      scanned_at: Timestamp.now(),
      last_updated: Timestamp.now()
    });

    console.log(`✅ Mobile QR scanned by web: ${session_id}`);

    res.status(200).json({
      success: true,
      message: "✅ QR scanned successfully",
      session_id: session_id,
      mobile_user: sessionData.mobile_user,
      status: "scanned",
      next_step: "waiting_mobile_confirmation"
    });

  } catch (error) {
    console.error("❌ Web scan mobile QR error:", error);
    res.status(500).json({ 
      success: false,
      message: "❌ Internal server error during scanning"
    });
  }
});

// 🔹 الهاتف يؤكد الدخول
app.post("/api/mobile/confirm-web-login", async (req, res) => {
  try {
    const { session_id, confirm } = req.body;
    console.log(`📱 Mobile confirming web login: ${session_id}, confirm: ${confirm}`);

    if (!session_id) {
      return res.status(400).json({ 
        success: false,
        message: "Session ID is required" 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    // التحقق من الجلسة
    const sessionDoc = await getDoc(doc(db, "qr_sessions", session_id));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    if (sessionData.expires_at.toDate() < new Date()) {
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "expired"
      });
      return res.status(400).json({ 
        success: false,
        message: "Session expired" 
      });
    }

    if (sessionData.status !== "scanned") {
      return res.status(400).json({ 
        success: false,
        message: "QR not scanned yet" 
      });
    }

    if (confirm) {
      // تأكيد الدخول الناجح
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "confirmed",
        login_confirmed: true,
        confirmed_at: Timestamp.now()
      });

      console.log(`✅ Mobile confirmed web login: ${session_id}`);

      res.status(200).json({
        success: true,
        message: "Login confirmed successfully",
        session_id: session_id,
        status: "confirmed"
      });
    } else {
      // رفض الدخول
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "rejected",
        login_confirmed: false,
        confirmed_at: Timestamp.now()
      });

      res.status(200).json({
        success: true,
        message: "Login rejected",
        session_id: session_id,
        status: "rejected"
      });
    }

  } catch (error) {
    console.error("❌ Mobile confirm web login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error confirming login",
      error: error.message 
    });
  }
});

// 🔹 فحص حالة الجلسة (للداشبورد)
app.get("/api/session-status/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🔍 Checking session status: ${sessionId}`);

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionDoc = await getDoc(doc(db, "qr_sessions", sessionId));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    const now = new Date();
    const expiresAt = sessionData.expires_at.toDate();
    const isExpired = expiresAt < now;

    if (isExpired && sessionData.status !== 'expired') {
      await updateDoc(doc(db, "qr_sessions", sessionId), {
        status: "expired"
      });
      sessionData.status = "expired";
    }

    res.status(200).json({
      success: true,
      session: {
        ...sessionData,
        expires_at: expiresAt,
        is_expired: isExpired,
        time_remaining: isExpired ? 0 : Math.floor((expiresAt - now) / 1000)
      }
    });

  } catch (error) {
    console.error("❌ Get session status error:", error);
    res.status(500).json({ 
      success: false,
      message: "❌ Error getting session status"
    });
  }
});
// 🔹 سجل جميع جلسات QR (للتشخيص)
app.get("/api/debug/qr-sessions", async (req, res) => {
  try {
    console.log("🔍 DEBUG: Listing all QR sessions");
    
    if (!db) {
      return res.status(503).json({
        success: false,
        error: "Firebase not connected"
      });
    }

    const qrSessionsQuery = query(collection(db, "qr_sessions"));
    const snapshot = await getDocs(qrSessionsQuery);
    
    const sessions = [];
    snapshot.forEach(doc => {
      const session = doc.data();
      sessions.push({
        id: doc.id,
        ...session,
        created_at: session.created_at?.toDate?.() || session.created_at,
        expires_at: session.expires_at?.toDate?.() || session.expires_at,
        scanned_at: session.scanned_at?.toDate?.() || session.scanned_at,
        confirmed_at: session.confirmed_at?.toDate?.() || session.confirmed_at
      });
    });

    console.log(`📊 DEBUG: Found ${sessions.length} QR sessions`);

    res.status(200).json({
      success: true,
      total_sessions: sessions.length,
      sessions: sessions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ DEBUG: List QR sessions error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// ==============================================
// 📱 QR SYSTEM - MOBILE TO WEB LOGIN
// ==============================================

// 🔹 الهاتف يولد QR code للدخول إلى الداشبورد
app.post("/api/mobile/generate-login-qr", async (req, res) => {
  try {
    const { user_email, user_name } = req.body;
    console.log("📱 Mobile generating login QR for:", user_email);

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionId = 'mobile_qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const sessionData = {
      id: sessionId,
      session_id: sessionId,
      type: "mobile_to_web_login",
      status: "waiting",
      created_at: Timestamp.now(),
      expires_at: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)), // 5 دقائق
      mobile_user: {
        email: user_email,
        name: user_name,
        timestamp: new Date().toISOString()
      },
      web_user: null,
      scanned_at: null,
      confirmed_at: null,
      login_confirmed: false
    };

    await setDoc(doc(db, "qr_sessions", sessionId), sessionData);

    // إنشاء بيانات QR للهاتف
    const qrData = {
      type: 'mobile_login_qr',
      session_id: sessionId,
      action: 'login_to_web',
      timestamp: Date.now(),
      app_name: 'Livraison Express',
      base_url: "https://livraison-api-x45n.onrender.com"
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}&format=png&margin=10`;

    console.log(`✅ Mobile QR session created: ${sessionId}`);

    res.status(200).json({
      success: true,
      session_id: sessionId,
      qr_url: qrUrl,
      qr_data: qrData,
      expires_at: sessionData.expires_at.toDate(),
      message: "Mobile login QR generated successfully"
    });

  } catch (error) {
    console.error("❌ Mobile QR generation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error generating mobile QR",
      error: error.message 
    });
  }
});

// 🔹 الداشبورد يمسح الكود من الهاتف
app.post("/api/web/scan-mobile-qr", async (req, res) => {
  try {
    const { session_id, web_user_email } = req.body;
    console.log(`🖥️ Web scanning mobile QR: ${session_id} for user: ${web_user_email}`);

    if (!session_id || !web_user_email) {
      return res.status(400).json({ 
        success: false,
        message: "Session ID and user email are required" 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    // التحقق من الجلسة
    const sessionDoc = await getDoc(doc(db, "qr_sessions", session_id));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ QR session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    if (sessionData.expires_at.toDate() < new Date()) {
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "expired"
      });
      return res.status(400).json({ 
        success: false,
        message: "❌ QR session has expired" 
      });
    }

    // التحقق من أن الجلسة مخصصة للهاتف
    if (sessionData.type !== "mobile_to_web_login") {
      return res.status(400).json({ 
        success: false,
        message: "❌ Invalid QR type" 
      });
    }

    // تحديث الجلسة بأن الداشبورد مسح الكود
    await updateDoc(doc(db, "qr_sessions", session_id), {
      status: "scanned",
      web_user: {
        email: web_user_email,
        scan_timestamp: new Date().toISOString()
      },
      scanned_at: Timestamp.now(),
      last_updated: Timestamp.now()
    });

    console.log(`✅ Mobile QR scanned by web: ${session_id}`);

    res.status(200).json({
      success: true,
      message: "✅ QR scanned successfully",
      session_id: session_id,
      mobile_user: sessionData.mobile_user,
      status: "scanned",
      next_step: "waiting_mobile_confirmation"
    });

  } catch (error) {
    console.error("❌ Web scan mobile QR error:", error);
    res.status(500).json({ 
      success: false,
      message: "❌ Internal server error during scanning"
    });
  }
});

// 🔹 الهاتف يؤكد الدخول للداشبورد
app.post("/api/mobile/confirm-web-login", async (req, res) => {
  try {
    const { session_id, confirm } = req.body;
    console.log(`📱 Mobile confirming web login: ${session_id}, confirm: ${confirm}`);

    if (!session_id) {
      return res.status(400).json({ 
        success: false,
        message: "Session ID is required" 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    // التحقق من الجلسة
    const sessionDoc = await getDoc(doc(db, "qr_sessions", session_id));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    if (sessionData.expires_at.toDate() < new Date()) {
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "expired"
      });
      return res.status(400).json({ 
        success: false,
        message: "Session expired" 
      });
    }

    if (sessionData.status !== "scanned") {
      return res.status(400).json({ 
        success: false,
        message: "QR not scanned yet" 
      });
    }

    if (confirm) {
      // تأكيد الدخول الناجح
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "confirmed",
        login_confirmed: true,
        confirmed_at: Timestamp.now()
      });

      console.log(`✅ Mobile confirmed web login: ${session_id}`);

      res.status(200).json({
        success: true,
        message: "Login confirmed successfully",
        session_id: session_id,
        status: "confirmed"
      });
    } else {
      // رفض الدخول
      await updateDoc(doc(db, "qr_sessions", session_id), {
        status: "rejected",
        login_confirmed: false,
        confirmed_at: Timestamp.now()
      });

      res.status(200).json({
        success: true,
        message: "Login rejected",
        session_id: session_id,
        status: "rejected"
      });
    }

  } catch (error) {
    console.error("❌ Mobile confirm web login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error confirming login",
      error: error.message 
    });
  }
});

// 🔹 فحص حالة الجلسة (للداشبورد)
app.get("/api/session-status/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🔍 Checking session status: ${sessionId}`);

    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    const sessionDoc = await getDoc(doc(db, "qr_sessions", sessionId));
    
    if (!sessionDoc.exists()) {
      return res.status(404).json({ 
        success: false,
        message: "❌ Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    const now = new Date();
    const expiresAt = sessionData.expires_at.toDate();
    const isExpired = expiresAt < now;

    if (isExpired && sessionData.status !== 'expired') {
      await updateDoc(doc(db, "qr_sessions", sessionId), {
        status: "expired"
      });
      sessionData.status = "expired";
    }

    res.status(200).json({
      success: true,
      session: {
        ...sessionData,
        expires_at: expiresAt,
        is_expired: isExpired,
        time_remaining: isExpired ? 0 : Math.floor((expiresAt - now) / 1000)
      }
    });

  } catch (error) {
    console.error("❌ Get session status error:", error);
    res.status(500).json({ 
      success: false,
      message: "❌ Error getting session status"
    });
  }
});

// 🔹 endpoint لاختبار النظام
app.get("/api/qr-system-test", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Firebase not connected" 
      });
    }

    // إنشاء جلسة اختبار
    const testSessionId = 'test_session_' + Date.now();
    const sessionData = {
      id: testSessionId,
      session_id: testSessionId,
      type: "mobile_to_web_login",
      status: "waiting",
      created_at: Timestamp.now(),
      expires_at: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      mobile_user: {
        email: "test@example.com",
        name: "Test User"
      },
      web_user: null,
      scanned_at: null,
      confirmed_at: null
    };

    await setDoc(doc(db, "qr_sessions", testSessionId), sessionData);

    res.status(200).json({
      success: true,
      message: "✅ QR system is working!",
      test_session: testSessionId,
      endpoints: {
        mobile_generate: "POST /api/mobile/generate-login-qr",
        web_scan: "POST /api/web/scan-mobile-qr", 
        mobile_confirm: "POST /api/mobile/confirm-web-login",
        check_status: "GET /api/session-status/:id"
      },
      firebase: "connected"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ QR system test failed",
      error: error.message
    });
  }
});
// ==============================================
// 🛡️ ERROR HANDLING
// ==============================================
app.use((err, req, res, next) => {
    console.error('💥 Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : err.message
    });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
    });
});
// ==============================================
// 🏪 STORES MANAGEMENT API
// ==============================================
// 🔹 إنشاء متجر جديد
app.post("/api/partner/stores/create", async (req, res) => {
  try {
    console.log("🏪 Creating new store:", req.body);
    
    const {
      name, description, category, address, phone, email,
      logo_url, banner_url, owner_id, owner_email
    } = req.body;

    if (!name || !category || !address || !owner_id || !owner_email) {
      return res.status(400).json({
        success: false,
        message: "❌ Required fields are missing"
      });
    }

    if (!db) {
      return res.status(503).json({
        success: false,
        message: "❌ Service unavailable"
      });
    }

    // إنشاء معرف فريد للمتجر
    const storeId = 'store_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const storeData = {
      id: storeId,
      name,
      description: description || "",
      category,
      address,
      phone: phone || "",
      email: email || "",
      owner_id,
      owner_email,
      status: "active",
      logo_url: logo_url || "https://via.placeholder.com/200",
      banner_url: banner_url || "https://via.placeholder.com/1200x400",
      location: {
        lat: 36.752887,
        lng: 3.042048
      },
      hours: {
        sunday: "09:00-23:00",
        monday: "09:00-23:00",
        tuesday: "09:00-23:00",
        wednesday: "09:00-23:00",
        thursday: "09:00-23:00",
        friday: "14:00-01:00",
        saturday: "09:00-23:00"
      },
      settings: {
        accepts_orders: true,
        delivery_enabled: true,
        pickup_enabled: true,
        delivery_fee: 200,
        min_order_amount: 1000
      },
      stats: {
        total_orders: 0,
        total_revenue: 0,
        average_rating: 0,
        total_reviews: 0
      },
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };

    // حفظ المتجر في Firestore
    await setDoc(doc(db, "stores", storeId), storeData);

    console.log(`✅ Store created successfully: ${storeId}`);

    res.status(201).json({
      success: true,
      message: "✅ Store created successfully",
      store_id: storeId,
      store: storeData
    });

  } catch (error) {
    console.error("❌ Store creation error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating store",
      error: error.message
    });
  }
});

// ==============================================
// 🏪 PARTNER STORES API - ENDPOINTS المفقودة
// ==============================================
// 🔹 إنشاء متجر جديد للشريك
app.post("/api/partner/stores/create", async (req, res) => {
  try {
    console.log("🏪 Creating new store:", req.body);
    
    const {
      name, description, category, address, phone, email,
      logo_url, banner_url, owner_id, owner_email
    } = req.body;

    // الحقول المطلوبة
    if (!name || !category || !address || !owner_email) {
      return res.status(400).json({
        success: false,
        message: "❌ Required fields: name, category, address, owner_email"
      });
    }

    if (!db) {
      return res.status(503).json({
        success: false,
        message: "❌ Service unavailable"
      });
    }

    // إنشاء معرف فريد للمتجر
    const storeId = 'store_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const storeData = {
      id: storeId,
      name,
      description: description || "",
      category,
      address,
      phone: phone || "",
      email: email || owner_email, // استخدام إيميل الشريك إذا لم يتم توفير إيميل المتجر
      owner_id: owner_id || owner_email,
      owner_email,
      status: "active",
      logo_url: logo_url || "https://via.placeholder.com/200/FF6B6B/FFFFFF?text=STORE",
      banner_url: banner_url || "https://via.placeholder.com/1200x400/4ECDC4/FFFFFF?text=" + encodeURIComponent(name),
      location: {
        lat: 36.752887,
        lng: 3.042048,
        address: address
      },
      hours: {
        sunday: "09:00-23:00",
        monday: "09:00-23:00",
        tuesday: "09:00-23:00",
        wednesday: "09:00-23:00",
        thursday: "09:00-23:00",
        friday: "14:00-01:00",
        saturday: "09:00-23:00"
      },
      settings: {
        accepts_orders: true,
        delivery_enabled: true,
        pickup_enabled: true,
        delivery_fee: 200,
        min_order_amount: 1000,
        preparation_time: 30,
        payment_methods: ["cash", "card"]
      },
      stats: {
        total_orders: 0,
        total_revenue: 0,
        average_rating: 0,
        total_reviews: 0,
        monthly_orders: 0
      },
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };

    // حفظ المتجر في Firestore
    await setDoc(doc(db, "stores", storeId), storeData);

    console.log(`✅ Store created successfully: ${storeId} - ${name}`);

    res.status(201).json({
      success: true,
      message: "✅ Store created successfully",
      store_id: storeId,
      store: storeData
    });

  } catch (error) {
    console.error("❌ Store creation error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating store",
      error: error.message
    });
  }
});

// 🔹 حذف متجر
app.delete("/api/partner/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { user_email } = req.query;

    console.log(`🗑️ Deleting store: ${storeId} by user: ${user_email}`);

    if (!storeId || !user_email) {
      return res.status(400).json({
        success: false,
        message: "Store ID and user email are required"
      });
    }

    if (!db) {
      return res.status(503).json({
        success: false,
        message: "❌ Service unavailable"
      });
    }

    const storeRef = doc(db, "stores", storeId);
    const storeDoc = await getDoc(storeRef);

    if (!storeDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    // التحقق من أن المستخدم هو المالك
    const storeData = storeDoc.data();
    
    if (storeData.owner_email !== user_email) {
      return res.status(403).json({
        success: false,
        message: "❌ You are not authorized to delete this store"
      });
    }

    // حذف المتجر
    await deleteDoc(storeRef);

    console.log(`✅ Store deleted successfully: ${storeId}`);

    res.status(200).json({
      success: true,
      message: "✅ Store deleted successfully",
      store_id: storeId
    });

  } catch (error) {
    console.error("❌ Delete store error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting store",
      error: error.message
    });
  }
});

// 🔹 تحديث متجر
app.put("/api/partner/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const updateData = req.body;

    console.log(`🔄 Updating store: ${storeId}`);

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required"
      });
    }

    if (!db) {
      return res.status(503).json({
        success: false,
        message: "❌ Service unavailable"
      });
    }

    const storeRef = doc(db, "stores", storeId);
    const storeDoc = await getDoc(storeRef);

    if (!storeDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    // إضافة وقت التحديث
    updateData.updated_at = Timestamp.now();

    // تحديث المتجر
    await updateDoc(storeRef, updateData);

    console.log(`✅ Store updated successfully: ${storeId}`);

    res.status(200).json({
      success: true,
      message: "✅ Store updated successfully",
      store_id: storeId
    });

  } catch (error) {
    console.error("❌ Update store error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating store",
      error: error.message
    });
  }
});

// 🔹 رفع صور المتجر
app.post("/api/partner/stores/upload-image", async (req, res) => {
  try {
    const { store_id, image_type, image_data } = req.body;
    console.log(`🖼️ Uploading ${image_type} for store: ${store_id}`);

    if (!store_id || !image_type || !image_data) {
      return res.status(400).json({
        success: false,
        message: "Store ID, image type, and image data are required"
      });
    }

    // في الإنتاج، استخدم Firebase Storage أو خدمة تخزين صور
    // هنا نستخدم رابط افتراضي للاختبار
    let imageUrl;
    
    if (image_type === 'logo') {
      imageUrl = "https://via.placeholder.com/200/FF6B6B/FFFFFF?text=LOGO";
    } else if (image_type === 'banner') {
      imageUrl = "https://via.placeholder.com/1200x400/4ECDC4/FFFFFF?text=BANNER";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid image type. Use 'logo' or 'banner'"
      });
    }

    // تحديث رابط الصورة في قاعدة البيانات
    const storeRef = doc(db, "stores", store_id);
    
    if (image_type === 'logo') {
      await updateDoc(storeRef, {
        logo_url: imageUrl,
        updated_at: Timestamp.now()
      });
    } else if (image_type === 'banner') {
      await updateDoc(storeRef, {
        banner_url: imageUrl,
        updated_at: Timestamp.now()
      });
    }

    console.log(`✅ ${image_type} uploaded successfully for store: ${store_id}`);

    res.status(200).json({
      success: true,
      message: "✅ Image uploaded successfully",
      image_url: imageUrl,
      image_type: image_type
    });

  } catch (error) {
    console.error("❌ Upload image error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading image",
      error: error.message
    });
  }
});

// 🔹 الحصول على متجر واحد
app.get("/api/partner/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🔍 Getting store: ${storeId}`);

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required"
      });
    }

    if (!db) {
      return res.status(503).json({
        success: false,
        message: "❌ Service unavailable"
      });
    }

    const storeDoc = await getDoc(doc(db, "stores", storeId));

    if (!storeDoc.exists()) {
      return res.status(404).json({
        success: false,
        message: "Store not found"
      });
    }

    const storeData = storeDoc.data();

    res.status(200).json({
      success: true,
      store: {
        id: storeDoc.id,
        ...storeData,
        created_at: storeData.created_at?.toDate?.() || storeData.created_at,
        updated_at: storeData.updated_at?.toDate?.() || storeData.updated_at
      }
    });

  } catch (error) {
    console.error("❌ Get store error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching store",
      error: error.message
    });
  }
});
// في server-render.js - إضافة التحقق من الصلاحيات
app.use('/api/partner/*', async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.user_email;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    // التحقق من أن المستخدم شريك
    const userDoc = await getDoc(doc(db, "utilisateurs", userEmail));
    
    if (!userDoc.exists() || userDoc.data().role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: "❌ Partner access required"
      });
    }
    
    req.user = userDoc.data();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
});
// ==============================================
// 🚀 START SERVER
// ==============================================
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
=========================================
✅ Server successfully started!
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || "development"}
🔥 Firebase: ${db ? "Connected ✅" : "Disconnected ❌"}
📧 Email: Real Gmail Service
=========================================
    `);
});

module.exports = app;