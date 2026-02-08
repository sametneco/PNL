// Keep Render service alive by pinging itself every 14 minutes
const https = require('https');

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

function ping() {
    if (!RENDER_URL) {
        console.log('⚠️ RENDER_EXTERNAL_URL not set, skipping ping');
        return;
    }

    const url = RENDER_URL.replace('http://', 'https://');
    
    https.get(url, (res) => {
        console.log(`✅ Keep-alive ping: ${res.statusCode} at ${new Date().toISOString()}`);
    }).on('error', (err) => {
        console.error('❌ Keep-alive ping failed:', err.message);
    });
}

// Ping every 14 minutes (before 15-minute timeout)
if (RENDER_URL) {
    console.log('🔄 Keep-alive service started');
    setInterval(ping, 14 * 60 * 1000);
    ping(); // Initial ping
} else {
    console.log('ℹ️ Keep-alive disabled (not on Render)');
}

module.exports = { ping };
