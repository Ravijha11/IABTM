# 🚀 IABTM - Intelligent AI-Based Talent Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black.svg)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)

> **A comprehensive full-stack platform for AI-powered talent management, personalized learning paths, and intelligent content curation with real-time collaboration features.**

## 🌟 Project Overview

IABTM is a cutting-edge platform that combines artificial intelligence, real-time communication, and personalized learning to create an intelligent ecosystem for talent development and content management. Built with modern web technologies, it offers a seamless experience for users to discover, learn, and collaborate.

## ✨ Key Features

### 🎯 **AI-Powered Personalization**
- **Intelligent Learning Paths**: AI-generated personalized learning journeys
- **Content Clustering**: Smart content organization and recommendations
- **Sentiment Analysis**: Advanced content analysis and user preference learning
- **Adaptive Learning**: Dynamic content adjustment based on user behavior

### 💬 **Real-Time Communication**
- **Live Chat Rooms**: Real-time messaging with WebSocket integration
- **Audio/Video Rooms**: LiveKit-powered audio and video conferencing
- **Group Management**: Advanced group creation, moderation, and collaboration
- **Personal Chats**: One-on-one messaging with rich media support

### 🛍️ **E-commerce Integration**
- **Shopify Integration**: Seamless e-commerce functionality
- **Payment Processing**: Stripe integration for secure transactions
- **Product Management**: Comprehensive product catalog and inventory
- **Shopping Cart**: Advanced cart functionality with real-time updates

### 📱 **Modern User Experience**
- **Responsive Design**: Mobile-first, cross-platform compatibility
- **Progressive Web App**: PWA features for enhanced user experience
- **Real-Time Updates**: Live data synchronization across all components
- **Intuitive Interface**: Clean, modern UI with smooth animations

### 🔐 **Security & Authentication**
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions and security
- **API Security**: Comprehensive API protection and rate limiting
- **Data Encryption**: Secure data transmission and storage

## 🏗️ Architecture & Technology Stack

### **Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **Next.js 14** - Full-stack React framework with App Router
- **TypeScript** - Type-safe development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions

### **Backend**
- **Node.js** - High-performance JavaScript runtime
- **Express.js** - Fast, unopinionated web framework
- **Socket.io** - Real-time bidirectional communication
- **LiveKit** - Professional audio/video infrastructure
- **JWT** - Secure authentication and authorization

### **Database & Storage**
- **MongoDB** - NoSQL database with advanced indexing
- **Redis** - High-performance caching and session management
- **Cloudinary** - Cloud-based media management
- **File System** - Local file storage with optimization

### **External Services**
- **Shopify API** - E-commerce platform integration
- **Stripe** - Payment processing and subscription management
- **Twilio** - SMS and communication services
- **Gemini AI** - Advanced AI content generation
- **YouTube Music API** - Music content integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- MongoDB 6.x or higher
- Redis (optional, for enhanced performance)
- npm or yarn package manager

### Installation

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

3. **Environment Setup**
   ```bash
   cd ../server
   node create-env-template.js
   ```
   
   Update the generated `.env` file with your actual API keys and credentials.

4. **Start the application**
   ```bash
   # Start the backend server
   cd server
   npm start
   
   # Start the frontend (in a new terminal)
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 📁 Project Structure

```
IABTM/
├── client/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App Router pages and layouts
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries and configurations
│   │   ├── store/         # State management (Zustand)
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── server/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/   # Business logic controllers
│   │   ├── models/        # Database models and schemas
│   │   ├── routes/        # API route definitions
│   │   ├── middlewares/   # Custom middleware functions
│   │   ├── helpers/       # Utility functions and helpers
│   │   └── services/      # Business services and integrations
│   └── database/          # Database scripts and schemas
└── docs/                  # Project documentation
```

## 🔧 Configuration

### Environment Variables

The application requires several environment variables for proper operation:

- **Database**: MongoDB connection string
- **Authentication**: JWT secret and configuration
- **External APIs**: Shopify, Stripe, Twilio, Cloudinary credentials
- **Real-time Services**: LiveKit and WebSocket configurations
- **Security**: CORS settings and API keys

See `IABTM/SETUP.md` for detailed configuration instructions.

## 🎨 Features in Detail

### **3605 Feed System**
- **Dynamic Content Feed**: AI-curated content based on user preferences
- **Real-Time Updates**: Live content synchronization
- **Media Integration**: Support for images, videos, and audio content
- **Social Features**: Like, comment, and share functionality

### **Personalized Learning Paths**
- **AI-Generated Paths**: Intelligent learning journey creation
- **Progress Tracking**: Comprehensive learning progress monitoring
- **Adaptive Content**: Dynamic content adjustment
- **Performance Analytics**: Detailed learning analytics and insights

### **Advanced Chat System**
- **Multi-Room Support**: Unlimited chat rooms with custom themes
- **File Sharing**: Secure file upload and sharing
- **Message History**: Persistent message storage and retrieval
- **User Management**: Advanced user roles and permissions

### **E-commerce Platform**
- **Product Catalog**: Comprehensive product management
- **Shopping Cart**: Advanced cart with real-time updates
- **Payment Processing**: Secure payment handling
- **Order Management**: Complete order lifecycle management

## 🚀 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   # Build frontend
   cd client
   npm run build
   
   # Prepare backend
   cd ../server
   npm run build
   ```

2. **Environment Configuration**
   - Set production environment variables
   - Configure production database connections
   - Set up SSL certificates
   - Configure reverse proxy (nginx/Apache)

3. **Process Management**
   - Use PM2 for Node.js process management
   - Set up monitoring and logging
   - Configure auto-restart policies

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual containers
docker build -t iabtm-client ./client
docker build -t iabtm-server ./server
```

## 📊 Performance & Optimization

### **Frontend Optimization**
- **Code Splitting**: Dynamic imports for better performance
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Analysis**: Webpack bundle analyzer for optimization
- **Caching Strategies**: Advanced caching for static assets

### **Backend Optimization**
- **Database Indexing**: Optimized MongoDB queries and indexes
- **Caching Layer**: Redis-based caching for improved response times
- **Connection Pooling**: Efficient database connection management
- **Rate Limiting**: API protection and performance optimization

### **Real-Time Performance**
- **WebSocket Optimization**: Efficient real-time communication
- **Media Streaming**: Optimized audio/video streaming
- **Load Balancing**: Horizontal scaling capabilities
- **Monitoring**: Real-time performance monitoring and alerts

## 🔒 Security Features

### **Authentication & Authorization**
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Session Management**: Secure session handling
- **Password Security**: Encrypted password storage

### **API Security**
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Secure cross-origin requests
- **API Key Management**: Secure external API integration

### **Data Protection**
- **Encryption**: Data encryption in transit and at rest
- **Privacy Controls**: User data privacy and GDPR compliance
- **Audit Logging**: Comprehensive activity logging
- **Backup Security**: Secure backup and recovery procedures

## 🧪 Testing

### **Testing Strategy**
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Load and stress testing

### **Running Tests**
```bash
# Frontend tests
cd client
npm test

# Backend tests
cd server
npm test

# E2E tests
npm run test:e2e
```

## 📈 Monitoring & Analytics

### **Application Monitoring**
- **Performance Metrics**: Response times and throughput
- **Error Tracking**: Comprehensive error logging and alerting
- **User Analytics**: User behavior and engagement metrics
- **System Health**: Server and database health monitoring

### **Business Intelligence**
- **User Engagement**: Content performance and user interaction
- **Learning Analytics**: Educational content effectiveness
- **E-commerce Metrics**: Sales and conversion tracking
- **Real-Time Dashboards**: Live system and business metrics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### **Code Standards**
- Follow ESLint configuration
- Use TypeScript for type safety
- Write comprehensive documentation
- Include unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **MongoDB Team** - For the robust database solution
- **LiveKit Team** - For professional audio/video infrastructure
- **Open Source Community** - For the incredible tools and libraries

## 📞 Support & Contact

- **Project Issues**: [GitHub Issues](https://github.com/Ravijha11/IABTM/issues)
- **Documentation**: [Project Wiki](https://github.com/Ravijha11/IABTM/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/Ravijha11/IABTM/discussions)

## 🌟 Star the Project

If you find this project helpful, please give it a ⭐ star on GitHub!

---

**Built with ❤️ by [Ravijha11](https://github.com/Ravijha11)**

*Empowering talent development through intelligent technology*
