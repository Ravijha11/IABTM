const mongoose = require('mongoose');
const User = require('./src/models/userModel.js');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iabtm');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test users data
const testUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    profilePicture: 'https://via.placeholder.com/150',
    isOnline: true
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    profilePicture: 'https://via.placeholder.com/150',
    isOnline: false
  },
  {
    name: 'Mike Johnson',
    email: 'mike@example.com',
    password: 'password123',
    profilePicture: 'https://via.placeholder.com/150',
    isOnline: true
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    profilePicture: 'https://via.placeholder.com/150',
    isOnline: false
  },
  {
    name: 'David Brown',
    email: 'david@example.com',
    password: 'password123',
    profilePicture: 'https://via.placeholder.com/150',
    isOnline: true
  }
];

// Check existing users
const checkUsers = async () => {
  try {
    console.log('🔍 Checking existing users...');
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('⚠️ No users found. Creating test users...');
      await createTestUsers();
    } else {
      const users = await User.find().select('name email isOnline');
      console.log('📋 Existing users:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.isOnline ? 'Online' : 'Offline'}`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
};

// Create test users
const createTestUsers = async () => {
  try {
    console.log('🚀 Creating test users...');
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️ User ${userData.name} already exists, skipping...`);
        continue;
      }

      // Create new user
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.name} (${userData.email})`);
    }

    console.log('🎉 Test users creation completed!');
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkUsers();
  
  console.log('\n🎯 Test completed! You can now test the group creation functionality.');
  console.log('📝 Test users created with email/password combinations:');
  testUsers.forEach(user => {
    console.log(`  - ${user.email} / password123`);
  });
  
  process.exit(0);
};

// Run the script
main().catch(console.error); 