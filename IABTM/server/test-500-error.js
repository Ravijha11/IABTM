import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './src/models/messageModel.js';
import User from './src/models/userModel.js';

dotenv.config();

const test500Error = async () => {
  try {
    console.log('🧪 Testing for 500 error causes...');
    
    // Test 1: Check MongoDB connection
    console.log('📋 Test 1: Checking MongoDB connection');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ MongoDB connected successfully');
    
    // Test 2: Check if Message model works
    console.log('📋 Test 2: Testing Message model');
    const messageCount = await Message.countDocuments();
    console.log('✅ Message count:', messageCount);
    
    // Test 3: Test aggregation pipeline
    console.log('📋 Test 3: Testing aggregation pipeline');
    const testUserId = '6738bcf5d98674b75f22bd7d'; // Use the user ID from our previous test
    
    const userObjectId = new mongoose.Types.ObjectId(testUserId);
    console.log('✅ User ObjectId created:', userObjectId);
    
    const personalConversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId, recipient: { $exists: true, $ne: null } },
            { recipient: userObjectId, sender: { $exists: true, $ne: null } }
          ],
          deleted: { $ne: true }
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ['$sender', userObjectId] },
              then: '$recipient',
              else: '$sender'
            }
          }
        }
      },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$sender', '$otherUser'] },
                    { $eq: ['$recipient', userObjectId] },
                    { $ne: [{ $in: [userObjectId, '$deliveryStatus.readBy.userId'] }, true] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'recipient'
        }
      },
      {
        $unwind: '$recipient'
      },
      {
        $project: {
          recipient: {
            _id: 1,
            name: 1,
            profilePicture: 1,
            isOnline: 1
          },
          lastMessage: {
            _id: 1,
            content: 1,
            createdAt: 1,
            sender: 1
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);
    
    console.log('✅ Aggregation completed successfully');
    console.log('📦 Personal conversations found:', personalConversations.length);
    console.log('📦 Sample conversation:', personalConversations[0]);
    
    // Test 4: Check if there are any messages with invalid ObjectIds
    console.log('📋 Test 4: Checking for invalid ObjectIds');
    const invalidMessages = await Message.find({
      $or: [
        { sender: { $exists: true, $ne: null, $type: 'string' } },
        { recipient: { $exists: true, $ne: null, $type: 'string' } }
      ]
    }).limit(5);
    
    if (invalidMessages.length > 0) {
      console.log('⚠️ Found messages with string IDs instead of ObjectIds:');
      invalidMessages.forEach(msg => {
        console.log('  - Message ID:', msg._id);
        console.log('  - Sender type:', typeof msg.sender);
        console.log('  - Recipient type:', typeof msg.recipient);
      });
    } else {
      console.log('✅ All messages have proper ObjectIds');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a MongoDB connection error
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      console.log('🔍 This is a MongoDB connection error');
    }
    
    // Check if it's an aggregation error
    if (error.message.includes('aggregation') || error.message.includes('pipeline')) {
      console.log('🔍 This is an aggregation pipeline error');
    }
    
    // Check if it's an ObjectId error
    if (error.message.includes('ObjectId') || error.message.includes('Cast to ObjectId')) {
      console.log('🔍 This is an ObjectId casting error');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

test500Error(); 