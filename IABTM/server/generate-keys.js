const crypto = require('crypto');

// Generate a random API key (32 characters)
const apiKey = crypto.randomBytes(16).toString('hex');

// Generate a random API secret (32 characters)
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