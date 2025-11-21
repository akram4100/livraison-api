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
// 👤 USER ROUTES - SIMPLE VERSION
// ==============================================

// 🔹 TEST ROUTE - للتأكد من أن الـ routes تعمل
app.get("/api/user-test", (req, res) => {
  console.log("✅ User test route called");
  res.json({
    message: "✅ User routes are WORKING!",
    availableEndpoints: [
      "POST /api/register",
      "POST /api/login"
    ],
    status: "ready"
  });
});

// 🔹 REGISTER USER - نسخة مبسطة
app.post("/api/register", (req, res) => {
  try {
    console.log("📥 Register request received:", req.body);
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ 
        message: "❌ Tous les champs sont obligatoires." 
      });
    }

    // استجابة تجريبية
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    res.status(200).json({ 
      message: "✅ Code de vérification généré.",
      email: email,
      code: verificationCode,
      note: "Firebase will be added in next phase"
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "❌ Erreur interne du serveur." });
  }
});

// 🔹 LOGIN USER - نسخة مبسطة
app.post("/api/login", (req, res) => {
  try {
    console.log("🔐 Login request received:", req.body);
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ 
        message: "❌ Email et mot de passe sont requis." 
      });
    }

    // استجابة تجريبية
    res.status(200).json({
      message: "✅ Connexion réussie.",
      user: {
        id: email,
        nom: "Test User",
        email: email,
        role: "client"
      },
      note: "Firebase authentication will be added in next phase"
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
🚀 User Routes: READY
=========================================
    `);
});

module.exports = app;