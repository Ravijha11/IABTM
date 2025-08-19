import axios from 'axios';

console.log('🧪 Simple Server Test...');

// Test LiveKit server
try {
  const ws = new WebSocket('ws://localhost:7880');
  ws.onopen = () => {
    console.log('✅ LiveKit Server is running on port 7880');
    ws.close();
  };
  ws.onerror = () => {
    console.log('❌ LiveKit Server not running on port 7880');
  };
} catch (error) {
  console.log('❌ LiveKit Server error:', error.message);
}

// Test backend server
setTimeout(async () => {
  try {
    const response = await axios.get('http://localhost:4000', { timeout: 5000 });
    console.log('✅ Backend Server is running on port 4000');
  } catch (error) {
    console.log('❌ Backend Server not running on port 4000');
  }
}, 1000); 