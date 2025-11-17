// test-db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  const dbConfig = {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };

  console.log('🔧 Testing DB Configuration:');
  console.log('Host:', dbConfig.host);
  console.log('User:', dbConfig.user);
  console.log('Database:', dbConfig.database);
  console.log('Port:', dbConfig.port);
  console.log('SSL:', dbConfig.ssl);

  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful!');
    
    // اختبار استعلام بسيط
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query successful:', rows);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    return false;
  }
}

testConnection();