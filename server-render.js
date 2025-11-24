// server-render.js - COMPLETE FIXED VERSION
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// ==============================================
// 🛡️ CORS CONFIGURATION
// ==============================================
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

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
const { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, deleteDoc, Timestamp 
} = require('firebase/firestore');

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

// 🔹 الحصول على حالة جلسة QR
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
        message: "Session not found" 
      });
    }

    const sessionData = sessionDoc.data();

    // التحقق من انتهاء الصلاحية
    if (sessionData.expires_at.toDate() < new Date()) {
      await updateDoc(doc(db, "qr_sessions", sessionId), {
        status: "expired"
      });
      return res.status(400).json({ 
        success: false,
        message: "Session expired" 
      });
    }

    console.log(`✅ Session status: ${sessionData.status}`);

    res.status(200).json({
      success: true,
      session: sessionData
    });

  } catch (error) {
    console.error("❌ Get QR session error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error getting session",
      error: error.message 
    });
  }
});

// 🔹 الهاتف: مسح QR
app.post("/api/mobile/scan-qr", async (req, res) => {
  try {
    const { session_id, device_info = {} } = req.body;
    console.log(`📱 Mobile scanning QR: ${session_id}`);

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

    // تحديث حالة الجلسة
    await updateDoc(doc(db, "qr_sessions", session_id), {
      status: "scanned",
      mobile_device: device_info,
      scanned_at: Timestamp.now()
    });

    console.log(`✅ QR scanned by mobile: ${session_id}`);

    res.status(200).json({
      success: true,
      message: "QR scanned successfully",
      session_type: sessionData.type,
      session_id: session_id
    });

  } catch (error) {
    console.error("❌ Mobile scan error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error scanning QR",
      error: error.message 
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

// 🔹 حذف جلسة QR (للتنظيف)
app.delete("/api/qr-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!db) {
      return res.status(503).json({ 
        success: false,
        message: "❌ Service unavailable" 
      });
    }

    await deleteDoc(doc(db, "qr_sessions", sessionId));
    
    console.log(`✅ QR session deleted: ${sessionId}`);
    
    res.status(200).json({
      success: true,
      message: "Session deleted successfully"
    });

  } catch (error) {
    console.error("❌ Delete QR session error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting session",
      error: error.message 
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