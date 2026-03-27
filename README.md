<div align="center">
  <img src="https://img.shields.io/badge/LinkUp-V1.0-blueviolet?style=for-the-badge&logo=appveyor" alt="LinkUp Logo" />
  <h1>💬 LinkUp</h1>
  <p><b>A high-performance, real-time multimedia messaging suite built with the MERN stack.</b></p>
  <p>
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  </p>
</div>

---

## 💎 Premium Features
> **Experience a desktop-grade, glassmorphic chat interface right in your browser.**

*   **⚡ Real-Time Messaging**: Instant 2-way communication powered by **Socket.io**.
*   **🟢 Live Presence & Last Seen**: Real-time online/offline status indicators mapped to exact user timelines.
*   **👀 Dynamic Read Receipts**: Track exactly when your messages are seen with instant live double-tick synchronizations.
*   **✍️ Typing Indicators**: Live "typing..." feedback for organic, synchronous conversations.
*   **🗑️ Message Lifecycles**: Full real-time support for soft-deleting messages across all connected clients.
*   **📸 Multimedia Attachments**: Send and receive Images, Videos, and Files seamlessly using **Cloudinary** CDNs.
*   **🎉 GIF & Sticker Integration**: Express yourself using the natively integrated **Tenor API** GIF & Sticker picker overlay.
*   **🔐 Secure Auth & Recovery**: Stateless JWT sessions, protected routing, and robust multi-step link via **Nodemailer** for secure password resets.
*   **🎨 Glassmorphic UI**: Rendered with modern deep-frost UI principals via custom CSS.
---

## 🛠️ Technical Architecture

### **Frontend Architecture**
| Layer | Technology |
| :--- | :--- |
| **Framework** | `React.js v18+` |
| **State Management** | `React Context (useReducer)` |
| **Routing** | `React Router DOM` |
| **Styling** | `Custom CSS` |
| **Toast Notifications** | `React Hot Toast` |

### **Backend & Real-time API**
| Layer | Technology |
| :--- | :--- |
| **Runtime** | `Node.js & Express.js` |
| **Database** | `MongoDB & Mongoose` |
| **Real-time Engine**| `Socket.io (WebSockets)` |
| **Authentication** | `JSON Web Tokens (JWT) & bcrypt` |
| **Media Storage** | `Cloudinary API` |
| **Mailing Service** | `Nodemailer` |

---

## 🚀 Installation & Local Development

To run this application locally, you will need `Node.js` installed directly on your machine alongside a local or cloud-hosted `MongoDB` cluster.

### 1. Clone the repository & Install Dependencies
First, install the backend dependencies:
```bash
cd server
npm install
```
Then, install the frontend client dependencies:
```bash
cd ../client
npm install
```

### 2. Configure Environment Variables
You will need to create two `.env` files. 

**Backend (`server/.env`):**
```env
PORT=3001
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL=your_email_address
EMAIL_PASSWORD=your_email_app_password
```

**Frontend (`client/.env`):**
```env
REACT_APP_API_URL=http://localhost:3001 # Or your production backend URL
```

### 3. Start the Development Servers
In two separate terminals, run the development scripts:

**Run the Backend Server:**
```bash
cd server
npm start
```

**Run the Frontend React App:**
```bash
cd client
npm start
```
*The React application will safely boot up on `http://localhost:3000` and automatically connect to your `http://localhost:3001` backend endpoints.*

---
<div align="center">
  <p><i>Built seamlessly with precision and scalability in mind.</i></p>
</div>
