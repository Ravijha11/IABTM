import axios from 'axios';

async function testConnections() {
  console.log('🧪 Testing Connections...\n');
  
  // Test 1: LiveKit Server Health (WebSocket)
  try {
    const WebSocket = (await import('ws')).WebSocket;
    const ws = new WebSocket('ws://localhost:7880/rtc?room=test&access_token=test_token');
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 3000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Connection failed'));
      };
    });
    
    console.log('✅ LiveKit Server: WebSocket server is running on port 7880');
  } catch (error) {
    console.log('❌ LiveKit Server not running:', error.message);
  }
  
  // Test 2: Backend Server Health
  try {
    const backendResponse = await axios.get('http://localhost:4000/api/livekit/health');
    console.log('✅ Backend Server:', backendResponse.data);
  } catch (error) {
    console.log('❌ Backend Server not running:', error.message);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Make sure both servers are running');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Create a group with audio room enabled');
  console.log('4. Test the audio room functionality');
}

testConnections().catch(console.error); 