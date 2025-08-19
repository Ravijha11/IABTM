#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🔧 MongoDB Installation Helper for Windows');
console.log('==========================================');

async function installMongoDB() {
    try {
        console.log('\n📋 Step 1: Checking if MongoDB is already installed...');
        
        try {
            const { stdout } = await execAsync('mongod --version');
            console.log('✅ MongoDB is already installed:');
            console.log(stdout.split('\n')[0]);
            
            console.log('\n📋 Step 2: Checking if MongoDB service is running...');
            try {
                const { stdout: serviceStatus } = await execAsync('net start | findstr MongoDB');
                if (serviceStatus.includes('MongoDB')) {
                    console.log('✅ MongoDB service is running');
                    console.log('🎉 MongoDB is ready to use!');
                    return;
                }
            } catch (error) {
                console.log('⚠️ MongoDB service is not running');
            }
            
            console.log('\n📋 Step 3: Starting MongoDB service...');
            try {
                await execAsync('net start MongoDB');
                console.log('✅ MongoDB service started successfully');
                console.log('🎉 MongoDB is ready to use!');
                return;
            } catch (error) {
                console.log('❌ Failed to start MongoDB service automatically');
                console.log('💡 Please start MongoDB manually:');
                console.log('   1. Open Command Prompt as Administrator');
                console.log('   2. Run: net start MongoDB');
            }
            
        } catch (error) {
            console.log('❌ MongoDB is not installed');
        }
        
        console.log('\n📋 Step 4: MongoDB Installation Instructions');
        console.log('=============================================');
        console.log('1. Download MongoDB Community Server:');
        console.log('   https://www.mongodb.com/try/download/community');
        console.log('');
        console.log('2. Run the installer with these settings:');
        console.log('   - Choose "Complete" installation');
        console.log('   - Install MongoDB as a Service: YES');
        console.log('   - Service Name: MongoDB');
        console.log('   - Data Directory: C:\\data\\db');
        console.log('   - Log Directory: C:\\data\\log');
        console.log('');
        console.log('3. After installation, start the service:');
        console.log('   - Open Command Prompt as Administrator');
        console.log('   - Run: net start MongoDB');
        console.log('');
        console.log('4. Test the connection:');
        console.log('   - Run: node check-mongodb.js');
        console.log('');
        console.log('5. Start your server:');
        console.log('   - Run: npm start');
        
    } catch (error) {
        console.error('❌ Error during MongoDB setup:', error.message);
    }
}

installMongoDB(); 