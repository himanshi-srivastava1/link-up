<div align="center">
  <img src="https://img.shields.io/badge/LinkUp-V2.0-blueviolet?style=for-the-badge&logo=appveyor" alt="LinkUp Logo" />
  <h1>💬 LinkUp</h1>
  <p><b>A modern, real-time messaging application with email-free authentication and seamless user experience.</b></p>
  <p>
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
    <img src="https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
  </p>
</div>

---

## 🌟 Key Features

### **🔐 Email-Free Authentication**
- **Instant Registration**: No email verification required - accounts are auto-verified
- **Secure Login**: JWT-based authentication with bcrypt password hashing
- **Token-Based Password Reset**: Reset passwords instantly without email dependencies
- **Stateless Sessions**: Secure JWT tokens for seamless user experience

### **⚡ Real-Time Messaging**
- **Instant Delivery**: Messages appear in real-time using Socket.io
- **Live Typing Indicators**: See when someone is typing
- **Read Receipts**: Track when messages are read
- **Online Status**: Real-time user presence indicators
- **Message Deletion**: Soft-delete with real-time synchronization

### **📸 Rich Media Support**
- **Image Sharing**: Upload and share images via Cloudinary CDN
- **Video Support**: Send and receive video files
- **File Attachments**: Share documents and files
- **GIF Integration**: Express with Tenor API GIFs and stickers
- **Emoji Support**: Native emoji picker in chat interface

### **🎨 Modern UI/UX**
- **Glassmorphic Design**: Modern glass-morphism UI with smooth animations
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Dark Theme**: Easy on the eyes with modern dark interface
- **Smooth Transitions**: Fluid animations and micro-interactions

---

## 🛠️ Technical Architecture

### **Frontend Stack**
| Technology | Purpose |
|------------|---------|
| **React 18+** | Component-based UI framework |
| **React Context** | State management for chat and user data |
| **React Router** | Client-side routing and navigation |
| **Socket.io Client** | Real-time WebSocket connections |
| **Axios** | HTTP client for API requests |
| **React Hot Toast** | Elegant toast notifications |
| **Moment.js** | Date and time formatting |

### **Backend Stack**
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | RESTful API framework |
| **Socket.io** | Real-time WebSocket server |
| **MongoDB** | NoSQL database for data storage |
| **Mongoose** | MongoDB object modeling |
| **JWT** | Authentication and authorization |
| **bcrypt** | Password hashing and security |
| **Cloudinary** | Media storage and CDN |
| **Rate Limiting** | API protection and performance |

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16+ installed
- MongoDB database (local or cloud)
- Cloudinary account for media storage

### **1. Clone & Install**
```bash
git clone <repository-url>
cd LinkUp

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### **2. Environment Setup**

**Backend (`server/.env`):**
```env
# Database
MONGO_URL=mongodb://localhost:27017/linkup

# JWT Secrets
SECRET_KEY=your_super_secret_jwt_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Cloudinary (for media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Server Configuration
PORT=3001
NODE_ENV=development
SERVE_FRONTEND=false

# Email (Optional - not used in current version)
# EMAIL_SERVICE=gmail
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password
```

**Frontend (`client/.env`):**
```env
REACT_APP_API_URL=http://localhost:3001
```

### **3. Start Development Servers**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start
```

Visit `http://localhost:3000` to access the application.

---

## 📱 Usage Guide

### **Getting Started**
1. **Sign Up**: Create an account instantly (no email required)
2. **Login**: Access your account with email and password
3. **Find Users**: Browse the user list and start conversations
4. **Chat**: Send messages, media, and real-time updates

### **Password Reset**
1. Click "Forgot Password" on login page
2. Enter your email address
3. Receive reset token instantly (no email needed)
4. Set new password and continue

### **Real-Time Features**
- **Online Status**: Green bubble shows active users
- **Typing Indicators**: See "typing..." when someone writes
- **Message Delivery**: Messages appear instantly
- **Read Receipts**: Double-check marks show read status

---

## 🔧 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Generate reset token
- `POST /api/auth/reset-password/:token` - Reset password

### **Chat & Messaging**
- `GET /api/chat` - Get user chats
- `POST /api/chat` - Create new chat
- `POST /api/message` - Send message
- `DELETE /api/message/:id` - Delete message
- `POST /api/message/upload` - Upload media

### **User Management**
- `GET /api/user` - Get user profile
- `PUT /api/user` - Update profile
- `POST /api/user/upload` - Upload profile picture

---

## 🌐 Deployment

### **Render.com Deployment**
1. **Connect Repository**: Link your GitHub repo to Render
2. **Environment Variables**: Add all required environment variables
3. **Build Settings**: 
   - Root Directory: `server`
   - Start Command: `npm start`
4. **Frontend**: Configure static file serving for production

### **Environment Variables for Production**
```env
NODE_ENV=production
SERVE_FRONTEND=true
FRONTEND_URL=https://your-app.onrender.com
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Socket.io** for real-time communication
- **Cloudinary** for media storage
- **React** for the frontend framework
- **MongoDB** for data storage
- **Render** for hosting services

---

<div align="center">
  <p><i>Built with ❤️ for seamless real-time communication</i></p>
  <p><strong>LinkUp v2.0 - Connecting People, Instantly</strong></p>
</div>
