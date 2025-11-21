// config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// إعدادات قاعدة البيانات المحلية
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // اتركها فارغة إذا ما عندك كلمة مرور
  database: process.env.DB_NAME || 'livraison_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('🔧 DB Config (LOCAL):', {
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port
});

// إنشاء connection pool
const db = mysql.createPool(dbConfig);

// اختبار الاتصال
db.getConnection()
  .then((connection) => {
    console.log('✅ Successfully connected to LOCAL MySQL database');
    connection.release();
  })
  .catch((error) => {
    console.log('❌ LOCAL MySQL connection failed:', error.message);
    console.log('💡 Tip: Install XAMPP/WAMP or ensure MySQL is running');
  });

export default db;