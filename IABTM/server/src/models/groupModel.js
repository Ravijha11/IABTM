import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Enhanced pinned messages support
  pinnedMessages: [{
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    },
    // Optional note about why it was pinned
    note: {
      type: String,
      maxlength: 200
    }
  }],

  // Enhanced group settings
  avatar: { type: String },
  isInviteOnly: { type: Boolean, default: false },
  rules: { type: String },
  inviteLinks: [{
    code: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
  }],
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  
  // Audio room configuration
  isMicEnabled: { type: Boolean, default: false }, // Frontend compatibility field
  audioRoom: {
    enabled: { type: Boolean, default: false },
    roomName: { type: String }, // LiveKit room name
    maxParticipants: { type: Number, default: 20 },
    isActive: { type: Boolean, default: false },
    startedAt: { type: Date },
    endedAt: { type: Date },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: { type: Date, default: Date.now },
      leftAt: { type: Date },
      isMuted: { type: Boolean, default: false },
      isSpeaking: { type: Boolean, default: false }
    }]
  }
}, { timestamps: true });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Virtual for online count (will be updated via socket)
groupSchema.virtual('onlineCount').get(function() {
  return 0; // Simplified - no real-time audio room tracking
});

// Ensure virtuals are serialized
groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

const Group = mongoose.model('Group', groupSchema);
export default Group; 