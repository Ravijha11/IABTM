// Simple script to generate LiveKit API keys
const crypto = require('crypto');

// Generate random API key and secret
const apiKey = crypto.randomBytes(16).toString('hex');
const apiSecret = crypto.randomBytes(16).toString('hex');

console.log('🔑 LiveKit API Keys Generated:');
console.log('================================');
console.log(`API Key: ${apiKey}`);
console.log(`API Secret: ${apiSecret}`);
console.log('================================');
console.log('');
console.log('📝 Add these to your .env file:');
console.log(`LIVEKIT_API_KEY=${apiKey}`);
console.log(`LIVEKIT_API_SECRET=${apiSecret}`);
console.log('');
console.log('⚠️  Keep these keys secure and never commit them to version control!'); 