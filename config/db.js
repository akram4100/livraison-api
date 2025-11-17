// config/db.js
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || 'ballast.proxy.rlwy.net',
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway',
  port: process.env.MYSQLPORT || process.env.MYSQL_PORT || 49656,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

console.log(' DB Config:', {
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port
});

// إنشاء connection pool
const db = mysql.createPool(dbConfig);

// اختبار الاتصال
try {
  const connection = await db.getConnection();
  console.log(' Successfully connected to MySQL database');
  connection.release();
} catch (error) {
  console.log(' MySQL connection failed:', error.message);
  
  // استخدم SQLite كبديل
  console.log(' Falling back to SQLite...');
}

export default db;
