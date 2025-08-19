const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

async function createSimpleUser() {
  console.log('🧪 Creating Simple Test User...\n');
  
  try {
    // Connect to database
    console.log('📋 Step 1: Connecting to database');
    const connectionString = process.env.MONGODB_URL + '/iabtm';
    await mongoose.connect(connectionString, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000
    });
    console.log('✅ Database connected successfully');
    
    // Define User schema inline to avoid import issues
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true, lowercase: true },
      password: { type: String, select: false },
      role: { type: String, default: 'user' },
      emailVerified: { type: Boolean, default: true }
    });
    
    // Add password hashing middleware
    userSchema.pre('save', async function (next) {
      if (!this.isModified('password')) return next();
      try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        next(error);
      }
    });
    
    // Add password comparison method
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };
    
    const User = mongoose.model('User', userSchema);
    
    // Check if test user already exists
    console.log('\n📋 Step 2: Checking for existing test user');
    const existingUser = await User.findOne({ email: 'test@test.com' });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('   Email: test@test.com');
      console.log('   Password: test123');
      console.log('   User ID:', existingUser._id);
      return;
    }
    
    // Create test user
    console.log('\n📋 Step 3: Creating test user');
    const testUser = new User({
      name: 'Test User',
      email: 'test@test.com',
      password: 'test123',
      role: 'user',
      emailVerified: true
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log('   Email: test@test.com');
    console.log('   Password: test123');
    console.log('   User ID:', testUser._id);
    
    console.log('\n🎉 Test user ready for login testing!');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

// Run the script
createSimpleUser(); 