// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// 🧪 Test Route
app.get("/", (req, res) => {
  res.send("🚀 API is running successfully!");
});

// 🔗 Import Routes
import userRoutes from "./routes/userRoutes.js";
app.use("/api/users", userRoutes);

// 🚀 START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
=========================================
🚀 Server running in ${process.env.NODE_ENV || "LOCAL"} MODE
🌍 URL: http://localhost:${PORT}
📡 API: /api/users
🗄  Database Host: ${process.env.MYSQLHOST || process.env.DB_HOST}
🛢  Database Name: ${process.env.MYSQLDATABASE || process.env.DB_NAME}
🔐 NODE_ENV: ${process.env.NODE_ENV}
=========================================
  `);
});

// مراقبة أخطاء قاعدة البيانات في الوقت الحقيقي
db.getConnection()
  .then(() => {
    console.log("📡 MySQL connected successfully.");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
  });
