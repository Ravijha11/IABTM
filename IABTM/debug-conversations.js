const mongoose = require('mongoose');
const Message = require('./server/src/models/messageModel.js');
const User = require('./server/src/models/userModel.js');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/iabtm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugConversations() {
  try {
    console.log('🔍 Debugging conversations...');
    
    // Get a sample user
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log('👤 Using user:', user._id, user.name);
    
    // Check if there are any messages
    const messageCount = await Message.countDocuments();
    console.log('📨 Total messages in database:', messageCount);
    
    // Check personal messages
    const personalMessages = await Message.find({
      $or: [
        { sender: user._id, recipient: { $exists: true, $ne: null } },
        { recipient: user._id, sender: { $exists: true, $ne: null } }
      ],
      deleted: { $ne: true }
    });
    
    console.log('💬 Personal messages found:', personalMessages.length);
    
    if (personalMessages.length > 0) {
      console.log('📋 Sample personal message:', {
        id: personalMessages[0]._id,
        sender: personalMessages[0].sender,
        recipient: personalMessages[0].recipient,
        content: personalMessages[0].content.substring(0, 50)
      });
    }
    
    // Test the aggregation pipeline
    const userObjectId = new mongoose.Types.ObjectId(user._id);
    
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
            ]
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
    
    console.log('✅ Aggregation result:', personalConversations.length, 'conversations');
    
    if (personalConversations.length > 0) {
      console.log('📋 Sample conversation:', {
        recipient: personalConversations[0].recipient.name,
        lastMessage: personalConversations[0].lastMessage.content.substring(0, 50),
        unreadCount: personalConversations[0].unreadCount
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugConversations(); 