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