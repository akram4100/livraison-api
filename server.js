// server.js - Fixed Version
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Import routes
import userRoutes from "./routes/userRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// ==============================================
// 🛡️ CORS CONFIGURATION - UPDATED FOR RENDER
// ==============================================
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "https://your-frontend-app.onrender.com", // سيتم تحديثه لاحقاً
  "http://localhost:3000",
  "http://localhost:8080",
  "capacitor://localhost"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
// 🔥 FIREBASE INITIALIZATION (FIXED)
// ==============================================
let db;

try {
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB2gSvCF-b2uAZM9j-EQAYs6UKjbRmuxrM",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "livraison-express-f48c3.firebaseapp.com",
        projectId: process.env.FIREBASE_PROJECT_ID || "livraison-express-f48c3",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "livraison-express-f48c3.firebasestorage.app",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1077573560587",
        appId: process.env.FIREBASE_APP_ID || "1:1077573560587:web:c1a1ffb4cd36f60d605a0e"
    };

    console.log('🔥 Initializing Firebase...');
    
    // ✅ FIX: Check if Firebase app already exists
    const existingApps = getApps();
    let firebaseApp;
    
    if (existingApps.length === 0) {
        // No app exists, initialize new one
        firebaseApp = initializeApp(firebaseConfig);
        console.log('✅ New Firebase app initialized');
    } else {
        // Use existing app
        firebaseApp = existingApps[0];
        console.log('✅ Using existing Firebase app');
    }
    
    db = getFirestore(firebaseApp);
    console.log('📡 Firebase Firestore connected successfully');

} catch (error) {
    console.error('💥 Firebase initialization failed:', error.message);
    process.exit(1);
}

// Export Firebase instance
export { db };

// ==============================================
// 🏥 ROUTES
// ==============================================
app.get("/", (req, res) => {
    res.json({
        message: "🚀 Livraison Express API is running!",
        database: "Firebase Firestore",
        status: "operational"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "Firebase Firestore"
    });
});

// API Routes
app.use("/api", userRoutes);

// 🛡️ Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Error:', err);
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

// 🔒 Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ==============================================
// 🚀 START SERVER - UPDATED FOR RENDER
// ==============================================
const PORT = process.env.PORT || 10000; // Render يستخدم PORT متغير

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=========================================
🚀 Server running in ${process.env.NODE_ENV || "development"} mode
📍 Port: ${PORT}
🌐 URL: https://livraison-api.onrender.com
🔥 Database: Firebase Firestore
📧 Email Service: ${process.env.GMAIL_USER ? '✅ Active' : '❌ Inactive'}
=========================================
  `);
});