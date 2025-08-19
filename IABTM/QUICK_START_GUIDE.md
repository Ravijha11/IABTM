# Quick Start Guide - Audio Room Fixes

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Servers

```bash
cd IABTM/server
./start-servers.bat
```

**Expected Output:**
```
========================================
Starting IABTM Audio Chat Servers
========================================

Starting LiveKit Server...
✅ LiveKit Server started successfully
Waiting 3 seconds for LiveKit Server to initialize...

Starting Backend Server...
✅ Backend Server started successfully

========================================
Both servers started successfully!
========================================

LiveKit Server: http://localhost:7880
Backend Server: http://localhost:8000
```

### Step 2: Start the Frontend

```bash
cd IABTM/client
npm run dev
```

### Step 3: Test the Audio Room

1. **Open your browser** and go to `http://localhost:3000`
2. **Sign in** to your account
3. **Navigate to the 3605 Feed** section
4. **Create a new group** with audio room enabled:
   - Click "Start Your Room"
   - Enter a room name
   - **Toggle ON** "Enable Audio Room"
   - Add some members
   - Click "Start Your Room"

### Step 4: Test Multi-User Functionality

1. **User A (Group Creator)**:
   - Click "Start Voice Chat" in the group
   - Grant microphone permissions
   - You should see "In Voice Chat" status

2. **User B (Group Member)**:
   - Open the same group in another browser/incognito window
   - You should see "Join Voice Chat" button
   - Click to join the existing room
   - Grant microphone permissions

3. **User C (Another Member)**:
   - Repeat the same process
   - All three users should now be in the same voice chat

## ✅ What Should Work Now

### Fixed Issues
- ✅ **No more immediate disconnections** - stable WebSocket connections
- ✅ **Any member can start a room** - not just the group creator
- ✅ **Any member can join existing rooms** - Discord-like functionality
- ✅ **Real-time participant updates** - see who's in the room
- ✅ **Automatic reconnection** - handles network issues gracefully

### New Features
- 🎤 **Dynamic button states** - Start/Join/In Voice Chat
- 👥 **Participant count** - shows how many people are in the room
- 🔄 **Connection status** - Connecting/Connected/Error states
- 💡 **Helpful tooltips** - explains what each user can do
- 🛡️ **Error recovery** - retry buttons when connection fails

## 🧪 Quick Test Scenarios

### Test 1: Basic Room Creation
```
1. Create group with audio enabled
2. Click "Start Voice Chat"
3. Should connect successfully
4. Should see "In Voice Chat" status
```

### Test 2: Multi-User Join
```
1. User A starts room (from Test 1)
2. User B opens same group
3. Should see "Join Voice Chat" button
4. Click to join
5. Both users should be in same room
```

### Test 3: Connection Recovery
```
1. Start a voice chat
2. Disconnect internet briefly
3. Reconnect internet
4. Should automatically reconnect
5. Should see "Reconnecting..." then "Connected"
```

### Test 4: Room Permissions
```
1. User A starts room
2. User B joins room
3. User C (not in group) tries to join
4. Should be denied access
5. Only group members can join
```

## 🔍 Debug Information

### Check Server Status
```bash
# Check if LiveKit server is running
curl http://localhost:7880

# Check if backend server is running
curl http://localhost:8000/health
```

### Browser Console Logs
Open browser console (F12) and look for:
- `🔌 [FRONTEND] Connecting to audio room`
- `✅ [FRONTEND] Successfully connected`
- `👤 Participant joined room`

### Common Error Messages
- **"Failed to connect"** → Check if servers are running
- **"Token expired"** → Refresh page and try again
- **"Room is full"** → Maximum 20 participants per room
- **"Not a member"** → Only group members can join

## 🎯 Expected Behavior

### When Room is Inactive
- Button shows: "Start Voice Chat"
- Status: "Voice chat available for this group - Click to start!"
- Any group member can click to start

### When Room is Active (You're Not Connected)
- Button shows: "Join Voice Chat"
- Status: "X participants in voice chat - Click to join!"
- Any group member can click to join

### When You're Connected
- Button shows: "In Voice Chat"
- Status: "X participants in voice chat"
- Click to open voice chat interface

### When Connection Fails
- Button shows: "Retry"
- Status: Shows error message
- Click to retry connection

## 🚨 Troubleshooting

### If Servers Won't Start
```bash
# Check if ports are in use
netstat -ano | findstr :7880
netstat -ano | findstr :8000

# Kill processes if needed
taskkill /PID <PID> /F
```

### If Connection Fails
1. **Check browser console** for detailed error messages
2. **Verify microphone permissions** are granted
3. **Try incognito mode** to rule out cache issues
4. **Check firewall settings** - ports 7880 and 8000 should be open

### If UI Looks Wrong
1. **Hard refresh** the page (Ctrl+F5)
2. **Clear browser cache** and cookies
3. **Check if you're on the latest version**

## 📞 Support

If you encounter issues:

1. **Check the detailed documentation**: `AUDIO_ROOM_FIXES.md`
2. **Run the automated tests**: `node test-audio-room.js`
3. **Check server logs** for error messages
4. **Verify all prerequisites** are met

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ **Any group member can start a voice chat**
- ✅ **Multiple users can join the same room**
- ✅ **Real-time audio communication works**
- ✅ **Connection remains stable**
- ✅ **UI shows correct states and participant counts**
- ✅ **No more "only host can start room" errors**

The audio room should now work exactly like Discord voice channels! 🎤 