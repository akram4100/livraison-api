// server-render.js - SIMPLE WORKING VERSION
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
// 🏥 BASIC ROUTES - WORKING
// ==============================================
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Livraison Express API is running on Render!",
        status: "operational",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "Ready for Firebase"
    });
});

// ==============================================
// 👤 USER ROUTES - WITH REAL FIREBASE
// ==============================================
const bcrypt = require("bcryptjs");
const { 
  collection, doc, getDoc, getDocs, setDoc, 
  query, where, deleteDoc, Timestamp 
} = require('firebase/firestore');

// 🔹 TEST ROUTE - مع معلومات Firebase
app.get("/api/user-test", (req, res) => {
  res.json({
    message: "✅ User routes with REAL Firebase!",
    availableEndpoints: [
      "POST /api/register - مع Firebase",
      "POST /api/login - مع Firebase", 
      "POST /api/verify-code - تحقق من الكود"
    ],
    firebase: db ? "Connected ✅" : "Disconnected ❌",
    status: "ready"
  });
});

// 🔹 REGISTER USER - مع Firebase حقيقي
app.post("/api/register", async (req, res) => {
  try {
    console.log("📥 Register request received:", req.body);
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ 
        message: "❌ Tous les champs sont obligatoires." 
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
    await setDoc(doc(db, "pending_verifications", `pending_${Date.now()}`), {
      nom, 
      email, 
      mot_de_passe: hashedPassword, 
      role,
      code_verification: verificationCode,
      date_creation: Timestamp.now(),
      expiration: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)) // 10 دقائق
    });

    console.log(`✅ User saved to Firebase: ${email}`);
    
    res.status(200).json({ 
      message: "✅ Utilisateur enregistré avec succès!",
      email: email,
      code: verificationCode,
      firebase: "saved"
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ 
      message: "❌ Erreur interne du serveur.",
      error: error.message 
    });
  }
});

// 🔹 LOGIN USER - مع Firebase حقيقي
app.post("/api/login", async (req, res) => {
  try {
    console.log("🔐 Login request received:", req.body);
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ 
        message: "❌ Email et mot de passe sont requis." 
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
🚀 User Routes: READY
=========================================
    `);
});

module.exports = app;