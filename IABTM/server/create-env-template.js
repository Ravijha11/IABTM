#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

console.log('🔧 Creating .env file from template...');
console.log('⚠️  Please update the placeholder values with your actual API keys and credentials');

const envContent = `# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_KEY_SECRET=your_api_secret

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email Configuration
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Redis Configuration (Aiven)
AIVEN_HOST=your_aiven_host
AIVEN_USERNAME=your_aiven_username
AIVEN_PORT=your_aiven_port
AIVEN_PASSWORD=your_aiven_password
SERVICE_URI=redis://username:password@host:port

# Upstash Configuration
UPSTASH_ENDPOINT=your_upstash_endpoint
UPSTASH_PASSWORD=your_upstash_password
UPSTASH_PORT=6379

# API Keys
MUSIC_API_HOST=your_music_api_host
MUSIC_API_KEY=your_music_api_key
GEMINI_API_KEY=your_gemini_api_key

# Shopify Configuration
Shopify_Token=your_shopify_token
NEXT_PUBLIC_SHOPIFY_SHOP=your_shop.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_shopify_access_token
shopify_Api_Key=your_shopify_api_key
Shopify_Api_Secret=your_shopify_api_secret

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Network Configuration
IP_ADDRESS=0.0.0.0
`;

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully from template!');
    console.log('📁 Location:', envPath);
    console.log('\n⚠️  IMPORTANT: Update the placeholder values with your actual credentials');
    console.log('\n🚀 Now you can start the server with: npm start');
} catch (error) {
    console.error('❌ Error creating .env file:', error.message);
}
