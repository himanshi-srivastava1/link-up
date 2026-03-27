const dotenv = require("dotenv");
dotenv.config({ path: './.env' });
const { server } = require('./app.js');

// Use port 3002 to avoid conflicts
const port = 3002;

server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Origins: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🔗 API URL: http://localhost:${port}`);
    console.log(`🔌 Socket.io: ws://localhost:${port}`);
    console.log(`💡 Update your frontend REACT_APP_API_URL to: http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Please stop the other process or use a different port.`);
        console.error(`💡 Try running: netstat -ano | findstr :${port} to find the process`);
        console.error(`💡 Then run: taskkill /PID <PID> /F to kill the process`);
    } else {
        console.error('❌ Server error:', err);
    }
    process.exit(1);
});
