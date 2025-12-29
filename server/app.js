const express = require("express");
const cors=require('cors');
const app = express();
const authRouter = require('./routes/authRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const chatRouter = require('./routes/chatRoutes.js');
const messageRouter = require('./routes/messageRoutes.js');
const User=require('./models/user.js')
app.use(cors());
app.use(express.json());
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3001",
        methods: ['GET', 'POST']
    },
    allowEIO3: true

});
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/message', messageRouter);
const onlineUsers = {};
io.on('connection', socket => {
    socket.on('join-room', userId => {
        socket.join(userId);
    })
    socket.on('send-message', (data) => {
        io.to(data.members[0])
            .to(data.members[1])
            .emit('receive-message', data)
    })
    socket.on('read-all-messages', (data) => {
        io.to(data.members.find(i => i !== data.readBy))
            .emit('messages-read-update', data)
    })
    socket.on('user-typing', (data) => {
        io
            .to(data.members[0])
            .to(data.members[1])
            .emit('started-typing', data)
    })
    socket.on('user-login', (userId) => {
        onlineUsers[socket.id] = userId;
        io.emit("online-users", Object.values(onlineUsers));
    })
    socket.on('disconnect',async () => {
        const userIdThatLeft=onlineUsers[socket.id];
        delete onlineUsers[socket.id];
        const isStillOnline=Object.values(onlineUsers).includes(userIdThatLeft);
        if(!isStillOnline){
            await User.findByIdAndUpdate(userIdThatLeft, {lastSeen: new Date()});
            io.emit('online-users', [...new Set(Object.values(onlineUsers))]);
            io.emit('last-seen-update',{
                userId:userIdThatLeft,
                lastSeen: new Date()
            });
        }
        
    })
})
module.exports = server;