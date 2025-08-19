# IABTM Project Setup Guide

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ravijha11/IABTM.git
   cd IABTM
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cd ../server
   node create-env-template.js
   ```
   
   This will create a `.env` file with placeholder values. **IMPORTANT**: Update the placeholder values with your actual API keys and credentials.

## 🔐 Required Environment Variables

### Server Configuration
- `PORT`: Server port (default: 8000)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRY`: JWT token expiry time

### Database
- `MONGODB_URL`: MongoDB connection string

### External Services
- **Cloudinary**: For image/file uploads
- **Twilio**: For SMS services
- **Stripe**: For payment processing
- **Shopify**: For e-commerce integration
- **Redis/Aiven**: For caching and sessions
- **Email**: For notifications

## ⚠️ Security Notes

- **Never commit real API keys** to version control
- **Use environment variables** for all sensitive data
- **Keep your .env file local** and add it to .gitignore
- **Use the template files** provided as starting points

## 🛠️ Development

### Start the server
```bash
cd server
npm start
```

### Start the client
```bash
cd client
npm run dev
```

## 📚 Documentation

Check the various `.md` files in the project root for detailed information about specific features and implementations.

## 🆘 Troubleshooting

If you encounter issues:
1. Check that all environment variables are properly set
2. Ensure MongoDB is running and accessible
3. Verify API keys are valid and have proper permissions
4. Check the console for detailed error messages
