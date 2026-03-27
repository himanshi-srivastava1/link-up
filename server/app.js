const express = require("express");
const { corsMiddleware, getAllowedOrigins } = require('./config/cors');
const cookieParser = require('cookie-parser');
const database = require('./config/database');
const socketManager = require('./config/socket');
const app = express();

// Connect to database
database.connect();

// Import routes
const authRouter = require('./routes/auth');
const userRouter = require('./routes/userRoutes.js');
const chatRouter = require('./routes/chatRoutes.js');
const messageRouter = require('./routes/messageRoutes.js');
const healthRouter = require('./routes/health');
const debugRouter = require('./routes/debug');
const errorHandler = require('./middleware/errorHandler');


app.use(corsMiddleware);




app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());


app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/message', messageRouter);
app.use('/health', healthRouter);


app.use('/debug', debugRouter);


app.use(errorHandler);


const path = require("path");

// Only serve static files if we're in a monolith deployment (not separate frontend)
if (process.env.NODE_ENV === "production" && process.env.SERVE_FRONTEND === "true") {
    app.use(express.static(path.join(__dirname, "../client/build")));

    // Handle React routing, return all requests to React app
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
    });
} else {
    // API-only deployment
    app.get("/", (req, res) => {
        res.send("LinkUp API is running... 🚀");
    });
}
const server = require('http').createServer(app);


const io = socketManager.initialize(server, getAllowedOrigins());


module.exports = { server, io, socketManager };