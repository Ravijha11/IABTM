const fs = require('fs');
const path = require('path');

// Read the userController file
const filePath = path.join(__dirname, 'server', 'src', 'controllers', 'userController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of sameSite: "strict" with sameSite: "lax"
const updatedContent = content.replace(/sameSite: "strict"/g, 'sameSite: "lax"');

// Write the updated content back
fs.writeFileSync(filePath, updatedContent);

console.log('✅ Fixed cookie sameSite settings in userController.js');
console.log('   Changed from "strict" to "lax" for cross-origin support'); 