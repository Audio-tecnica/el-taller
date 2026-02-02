const https = require('https');

const BACKEND_URL = 'https://el-taller.onrender.com';

function ping() {
  https.get(`${BACKEND_URL}/health`, (res) => {
    console.log(`✅ Keep-alive ping: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('❌ Keep-alive error:', err.message);
  });
}

// Hacer ping cada 14 minutos (840000ms)
setInterval(ping, 14 * 60 * 1000);

// Ping inicial
ping();

module.exports = { ping };