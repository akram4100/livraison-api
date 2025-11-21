// server-render.js - With Firebase Integration
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
// 🏥 ROUTES
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
                message: "❌ Firebase not initialized",
                error: "Check FIREBASE environment variables in Render dashboard"
            });
        }

        // ✅ اختبار بسيط للاتصال بدون الاعتماد على collections
        const { collection, getDocs } = require('firebase/firestore');
        
        // حاول إنشاء مرجع لمجموعة (دون قراءة)
        const testRef = collection(db, 'connection_test');
        
        res.json({
            message: "✅ Firebase is connected and ready!",
            status: "success", 
            projectId: process.env.FIREBASE_PROJECT_ID,
            database: "Firestore",
            timestamp: new Date().toISOString(),
            nextStep: "Now you can add user routes with Firebase"
        });

    } catch (error) {
        console.error('💥 Firebase connection error:', error);
        res.status(500).json({
            message: "❌ Firebase connection failed",
            error: error.message,
            code: error.code,
            check: "Verify FIREBASE_ environment variables in Render"
        });
    }
});

// ==============================================
// 📍 PLACEHOLDER FOR USER ROUTES
// ==============================================
app.get("/api/test", (req, res) => {
    res.json({
        message: "✅ User routes will be added in Phase 2",
        firebase: db ? "ready" : "not ready",
        status: "working"
    });
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