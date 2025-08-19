import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from './src/models/messageModel.js';
import User from './src/models/userModel.js';

dotenv.config();

const testMessages = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Check if there are any messages
    const messageCount = await Message.countDocuments();
    console.log('📊 Total messages in database:', messageCount);

    if (messageCount === 0) {
      console.log('❌ No messages found in database');
      return;
    }

    // Get a sample message
    const sampleMessage = await Message.findOne().populate('sender recipient');
    console.log('📝 Sample message:', JSON.stringify(sampleMessage, null, 2));

    // Get all users
    const userCount = await User.countDocuments();
    console.log('👥 Total users in database:', userCount);

    if (userCount > 0) {
      const sampleUser = await User.findOne();
      console.log('👤 Sample user:', JSON.stringify(sampleUser, null, 2));

      // Test the aggregation pipeline for this user
      const userObjectId = new mongoose.Types.ObjectId(sampleUser._id);
      console.log('🔍 Testing aggregation for user:', userObjectId);

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

      console.log('✅ Personal conversations found:', personalConversations.length);
      console.log('📦 Personal conversations data:', JSON.stringify(personalConversations, null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing messages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testMessages(); 