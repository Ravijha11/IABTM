#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 Checking MongoDB installation and status...');

async function checkMongoDB() {
    try {
        // Check if MongoDB is installed
        console.log('📦 Checking MongoDB installation...');
        const { stdout: versionOutput } = await execAsync('mongod --version');
        console.log('✅ MongoDB is installed:');
        console.log(versionOutput.split('\n')[0]);
        
        // Check if MongoDB service is running
        console.log('\n🔍 Checking if MongoDB service is running...');
        try {
            const { stdout: statusOutput } = await execAsync('net start | findstr MongoDB');
            if (statusOutput.includes('MongoDB')) {
                console.log('✅ MongoDB service is running');
            } else {
                console.log('⚠️ MongoDB service is not running');
                console.log('💡 To start MongoDB service:');
                console.log('   - Open Command Prompt as Administrator');
                console.log('   - Run: net start MongoDB');
            }
        } catch (error) {
            console.log('⚠️ Could not check MongoDB service status');
            console.log('💡 Please ensure MongoDB is running manually');
        }
        
        // Test connection
        console.log('\n🔌 Testing MongoDB connection...');
        try {
            const { stdout: testOutput } = await execAsync('mongosh --eval "db.runCommand({ping: 1})" --quiet');
            if (testOutput.includes('ok')) {
                console.log('✅ MongoDB connection test successful');
            } else {
                console.log('❌ MongoDB connection test failed');
            }
        } catch (error) {
            console.log('❌ MongoDB connection test failed');
            console.log('💡 Make sure MongoDB is running on localhost:27017');
        }
        
    } catch (error) {
        console.log('❌ MongoDB is not installed or not in PATH');
        console.log('\n📋 To install MongoDB:');
        console.log('1. Download from: https://www.mongodb.com/try/download/community');
        console.log('2. Install with default settings');
        console.log('3. Add MongoDB to your system PATH');
        console.log('4. Start MongoDB service');
    }
}

checkMongoDB().catch(console.error); 