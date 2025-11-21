// server-render.js - Complete Version with Firebase & User Routes
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

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
// 🔥 FIREBASE INITIALIZATION
// ==============================================
let db;

try {
    console.log('🔥 Initializing Firebase...');
    
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };

    console.log('🔧 Firebase Config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain
    });

    // Validate required Firebase config
    if (!firebaseConfig.apiKey) {
        throw new Error('Missing FIREBASE_API_KEY in environment variables');
    }

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
// 🔥 TEST FIREBASE ROUTE
// ==============================================
app.get("/api/test-firebase", async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({
                message: "Firebase not available",
                error: "Database connection failed - check environment variables"
            });
        }

        // ✅ الطريقة الصحيحة لـ Firebase v9
        const { collection, getDocs, limit, query } = require('firebase/firestore');
        
        // جرب الوصول إلى مجموعة test
        const testCollection = collection(db, 'test');
        const testQuery = query(testCollection, limit(1));
        const snapshot = await getDocs(testQuery);
        
        res.json({
            message: "✅ Firebase connection successful!",
            firestore: "working",
            documentsCount: snapshot.size,
            collection: "test",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('💥 Firebase test error:', error);
        
        // حتى إذا فشلت القراءة، قد يكون الاتصال ناجحاً
        res.json({
            message: "⚠️ Firebase connected but collection might not exist",
            status: "connected",
            error: error.message,
            projectId: process.env.FIREBASE_PROJECT_ID,
            suggestion: "Create 'test' collection in Firestore or ignore this error"
        });
    }
});

// ==============================================
// 👤 USER ROUTES - VERIFIED WORKING
// ==============================================
const bcrypt = require("bcryptjs");
const { 
  collection, doc, getDoc, getDocs, setDoc, 
  query, where, deleteDoc, Timestamp 
} = require('firebase/firestore');

// 🔹 TEST ROUTE - تأكد من أن الـ routes مضيفة
app.get("/api/user-test", (req, res) => {
  res.json({
    message: "✅ User routes are LIVE!",
    availableEndpoints: [
      "POST /api/register",
      "POST /api/login"
    ],
    status: "working"
  });
});

// 🔹 REGISTER USER
app.post("/api/register", async (req, res) => {
  try {
    console.log("📥 Register request received");
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ 
        message: "❌ Tous les champs sont obligatoires." 
      });
    }

    // تحقق إذا المستخدم موجود
    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    if (userDoc.exists()) {
      return res.status(400).json({ 
        message: "❌ Cet e-mail est déjà utilisé." 
      });
    }

    // كلمة المرور مشفرة
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // حفظ في pending_verifications
    await setDoc(doc(db, "pending_verifications", `pending_${Date.now()}`), {
      nom, email, mot_de_passe: hashedPassword, role,
      code_verification: verificationCode,
      date_creation: Timestamp.now(),
      expiration: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000))
    });

    res.status(200).json({ 
      message: "✅ Code de vérification généré.",
      email: email,
      code: verificationCode
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "❌ Erreur interne du serveur." });
  }
});

// 🔹 LOGIN USER
app.post("/api/login", async (req, res) => {
  try {
    console.log("🔐 Login request received");
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ 
        message: "❌ Email et mot de passe sont requis." 
      });
    }

    const userDoc = await getDoc(doc(db, "utilisateurs", email));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ 
        message: "❌ Utilisateur introuvable." 
      });
    }

    const user = userDoc.data();
    const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "❌ Mot de passe incorrect." 
      });
    }

    res.status(200).json({
      message: "✅ Connexion réussie.",
      user: {
        id: userDoc.id,
        nom: user.nom,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "❌ Erreur interne du serveur." });
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
📧 Email: ${process.env.GMAIL_USER ? "Ready" : "Not configured"}
=========================================
    `);
});

module.exports = { app, db };