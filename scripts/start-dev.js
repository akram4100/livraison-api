// scripts/start-dev.js
const { exec } = require('child_process');
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const interfaceName in interfaces) {
    for (const interface of interfaces[interfaceName]) {
      // IPv4 وغير internal
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const localIP = getLocalIP();
console.log('📱 Local IP Address:', localIP);
console.log('🌐 Your app will be available on:');
console.log(`   http://${localIP}:3000 (Frontend)`);
console.log(`   http://${localIP}:8080 (Backend)`);

// تشغيل السرفر
console.log('🚀 Starting backend server...');
exec('cd livraison-backend && npm start', (error, stdout, stderr) => {
  if (error) {
    console.error('Backend error:', error);
    return;
  }
  console.log(stdout);
});