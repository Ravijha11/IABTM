import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
  createGroup,
  getUserGroups,
  editGroup,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
  getGroupDetails,
  updateGroupAvatar,
  updateGroupAnnouncement,
  promoteAdmin,
  demoteAdmin,
  removeMember,
  transferOwnership,
  pinMessage,
  unpinMessage,
  leaveGroup,
  blockGroup,
  reportGroup,
  muteGroupNotifications,
  setChatBackground,
  toggleJoinPermissions,
  generateInviteLink,
  editGroupRules,
  getAuditLog,
  getGroupMedia,
  startAudioRoom,
  joinAudioRoom,
  leaveAudioRoom,
  endAudioRoom,
  getAudioRoomStatus,
  getAudioRoomToken
} from '../controllers/groupController.js';
import { upload } from '../middlewares/multerMiddleware.js';

const router = express.Router();

// Group CRUD operations
router.post('/create', authenticate, createGroup);
router.get('/my-groups', authenticate, getUserGroups);
router.put('/:groupId', authenticate, editGroup);
router.delete('/:groupId', authenticate, deleteGroup);
router.get('/:groupId', authenticate, getGroupDetails);

// Group member management
router.post('/:groupId/members', authenticate, addGroupMember);
router.delete('/:groupId/members/:memberId', authenticate, removeGroupMember);
router.post('/:groupId/leave', authenticate, leaveGroup);

// Group admin operations
router.post('/:groupId/admins/:memberId', authenticate, promoteAdmin);
router.delete('/:groupId/admins/:memberId', authenticate, demoteAdmin);
router.post('/:groupId/transfer/:memberId', authenticate, transferOwnership);

// Group moderation
router.post('/:groupId/block', authenticate, blockGroup);
router.post('/:groupId/report', authenticate, reportGroup);
router.post('/:groupId/mute', authenticate, muteGroupNotifications);
router.delete('/:groupId/mute', authenticate, muteGroupNotifications);

// Group settings
router.put('/:groupId/avatar', authenticate, upload.single('avatar'), updateGroupAvatar);
router.put('/:groupId/announcement', authenticate, updateGroupAnnouncement);
router.put('/:groupId/background', authenticate, setChatBackground);
router.put('/:groupId/join-permissions', authenticate, toggleJoinPermissions);
router.put('/:groupId/rules', authenticate, editGroupRules);

// Group features
router.post('/:groupId/pin/:messageId', authenticate, pinMessage);
router.delete('/:groupId/pin/:messageId', authenticate, unpinMessage);
router.get('/:groupId/audit-log', authenticate, getAuditLog);
router.get('/:groupId/media', authenticate, getGroupMedia);

// Invite links
router.post('/:groupId/invite-link', authenticate, generateInviteLink);

// Audio Room Management
router.post('/:groupId/audio-room/token', authenticate, getAudioRoomToken); // New consolidated endpoint
router.post('/:groupId/audio-room/start', authenticate, startAudioRoom);
router.post('/:groupId/audio-room/join', authenticate, joinAudioRoom);
router.post('/:groupId/audio-room/leave', authenticate, leaveAudioRoom);
router.post('/:groupId/audio-room/end', authenticate, endAudioRoom);
router.get('/:groupId/audio-room/status', authenticate, getAudioRoomStatus);

export default router; 