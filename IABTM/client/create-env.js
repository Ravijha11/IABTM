#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');

console.log('🔧 Creating .env.local file for Next.js frontend...');

const envContent = `# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Shopify Configuration
NEXT_PUBLIC_SHOPIFY_SHOP=iabtm.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=801efd9d1261cd4956cd472491920a33

# Shopify Essentials Store Configuration
SHOPIFY_ESSENTIALS_STOREFRONT_ACCESS_TOKEN=912d0ef1e2b2380507955594385372e4

# Other configurations
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local file created successfully!');
    console.log('📁 Location:', envPath);
    console.log('\n🚀 Now restart your Next.js development server:');
    console.log('   npm run dev');
    console.log('\n✅ Shopify Essentials storefront access token has been configured!');
} catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
} 