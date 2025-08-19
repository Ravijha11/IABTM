import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['personal', 'group'],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  // For group chats
  name: {
    type: String,
    required: function() { return this.type === 'group'; }
  },
  description: String,
  avatar: String,
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isMicEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ type: 1, participants: 1 });
chatSchema.index({ createdBy: 1 });
chatSchema.index({ lastMessageTime: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat; 