/**
 * Professional Socket.io Configuration
 * 
 * This module provides a comprehensive Socket.io setup with proper event handling,
 * room management, and real-time features following enterprise best practices.
 */

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Message = require('../models/message');
const Chat = require('../models/chat');
const asyncHandler = require('../middleware/asyncHandler');

class SocketManager {
    constructor() {
        this.io = null;
        this.onlineUsers = new Map(); // socketId -> userId
        this.userSockets = new Map(); // userId -> Set of socketIds
        this.roomUsers = new Map(); // roomId -> Set of userIds
        this.typingUsers = new Map(); // roomId -> Map of userId -> timeout
    }

    /**
     * Initialize Socket.io with professional configuration
     */
    initialize(server, allowedOrigins) {
        this.io = socketIo(server, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST'],
                credentials: true,
                allowedHeaders: ['Authorization', 'Content-Type']
            },
            allowEIO3: true,
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.setupMiddleware();
        this.setupEventHandlers();
        
        console.log('🔌 Socket.io initialized successfully');
        return this.io;
    }

    /**
     * Setup authentication middleware for Socket.io
     */
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                // Verify JWT token
                const decoded = jwt.verify(token, process.env.SECRET_KEY);
                const user = await User.findById(decoded.userId);
                
                if (!user) {
                    return next(new Error('User not found'));
                }

                if (!user.isEmailVerified) {
                    return next(new Error('Email not verified'));
                }

                // Attach user to socket
                socket.user = user;
                socket.userId = user._id.toString();
                
                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });
    }

    /**
     * Setup all Socket.io event handlers
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
            this.setupSocketEventHandlers(socket);
        });
    }

    /**
     * Handle new socket connection
     */
    handleConnection(socket) {
        const userId = socket.userId;
        const socketId = socket.id;

        console.log(`🔌 User connected: ${socket.user.firstname} (${socketId})`);

        // Track online users
        this.onlineUsers.set(socketId, userId);
        
        // Track user's multiple sockets
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socketId);

        // Update user's online status
        this.updateUserOnlineStatus(userId, true);

        // Join user to their personal room for direct messages
        socket.join(`user:${userId}`);

        // Join all user's chat rooms
        this.joinUserToChats(socket, userId);

        // Emit updated online users list
        this.emitOnlineUsers();

        // Emit to friends that this user is online
        this.emitUserOnlineStatus(userId, true);
    }

    /**
     * Setup event handlers for individual socket
     */
    setupSocketEventHandlers(socket) {
        const userId = socket.userId;

        // Join chat room
        socket.on('join-room', asyncHandler(async (data) => {
            await this.handleJoinRoom(socket, data);
        }));

        // Leave chat room
        socket.on('leave-room', asyncHandler(async (data) => {
            await this.handleLeaveRoom(socket, data);
        }));

        // Send message
        socket.on('send-message', asyncHandler(async (data) => {
            await this.handleSendMessage(socket, data);
        }));

        // Mark messages as read
        socket.on('mark-messages-read', asyncHandler(async (data) => {
            await this.handleMarkMessagesRead(socket, data);
        }));

        // User typing
        socket.on('user-typing', (data) => {
            this.handleUserTyping(socket, data);
        });

        // User stopped typing
        socket.on('user-stop-typing', (data) => {
            this.handleUserStopTyping(socket, data);
        });

        // Delete message
        socket.on('delete-message', asyncHandler(async (data) => {
            await this.handleDeleteMessage(socket, data);
        }));

        // Edit message
        socket.on('edit-message', asyncHandler(async (data) => {
            await this.handleEditMessage(socket, data);
        }));

        // Add reaction
        socket.on('add-reaction', asyncHandler(async (data) => {
            await this.handleAddReaction(socket, data);
        }));

        // Remove reaction
        socket.on('remove-reaction', asyncHandler(async (data) => {
            await this.handleRemoveReaction(socket, data);
        }));

        // Handle disconnection
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });

        // Handle connection errors
        socket.on('error', (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    }

    /**
     * Join user to their existing chat rooms
     */
    async joinUserToChats(socket, userId) {
        try {
            const userChats = await Chat.find({
                members: userId,
                isActive: true
            }).select('_id members');

            for (const chat of userChats) {
                const roomId = `chat:${chat._id}`;
                socket.join(roomId);
                
                // Track room users
                if (!this.roomUsers.has(roomId)) {
                    this.roomUsers.set(roomId, new Set());
                }
                this.roomUsers.get(roomId).add(userId);
            }
        } catch (error) {
            console.error('Error joining user to chats:', error);
        }
    }

    /**
     * Handle joining a chat room
     */
    async handleJoinRoom(socket, data) {
        if (!data) return;
        const chatId = typeof data === 'string' ? data : data.chatId;
        if (!chatId) return;
        
        const userId = socket.userId;
        const roomId = `chat:${chatId}`;

        try {
            // Verify user is member of chat
            const chat = await Chat.findOne({
                _id: chatId,
                members: userId,
                isActive: true
            });

            if (!chat) {
                socket.emit('error', { message: 'Chat not found or access denied' });
                return;
            }

            socket.join(roomId);

            // Track room users
            if (!this.roomUsers.has(roomId)) {
                this.roomUsers.set(roomId, new Set());
            }
            this.roomUsers.get(roomId).add(userId);

            // Notify others in room
            socket.to(roomId).emit('user-joined-room', {
                chatId,
                user: {
                    id: socket.user._id,
                    firstname: socket.user.firstname,
                    lastname: socket.user.lastname
                }
            });

            console.log(`📱 User ${socket.user.firstname} joined room ${roomId}`);

        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    }

    /**
     * Handle leaving a chat room
     */
    async handleLeaveRoom(socket, data) {
        const { chatId } = data;
        const userId = socket.userId;
        const roomId = `chat:${chatId}`;

        socket.leave(roomId);

        // Remove from room tracking
        if (this.roomUsers.has(roomId)) {
            this.roomUsers.get(roomId).delete(userId);
            if (this.roomUsers.get(roomId).size === 0) {
                this.roomUsers.delete(roomId);
            }
        }

        // Notify others in room
        socket.to(roomId).emit('user-left-room', {
            chatId,
            user: {
                id: socket.user._id,
                firstname: socket.user.firstname,
                lastname: socket.user.lastname
            }
        });

        console.log(`📱 User ${socket.user.firstname} left room ${roomId}`);
    }

    /**
     * Handle sending a message
     */
    async handleSendMessage(socket, data) {
        const { chatId, content, messageType = 'text', replyTo, _id } = data;
        const userId = socket.userId;
        const roomId = `chat:${chatId}`;

        try {
            // Validate chat access
            const chat = await Chat.findOne({
                _id: chatId,
                members: userId,
                isActive: true
            });

            if (!chat) {
                socket.emit('error', { message: 'Chat not found or access denied' });
                return;
            }

            let populatedMessage;
            if (_id) {
                populatedMessage = await Message.findById(_id)
                    .populate('sender', 'firstname lastname profilePic')
                    .populate('replyTo', 'content.text sender');
            }

            if (!populatedMessage) {
                // Create message with proper content structure
                const messageData = {
                    chatId,
                    sender: userId,
                    content: content || { text: '', image: '', video: '' }, // Handle different content structures
                    messageType: messageType || 'text'
                };

                const newMessage = new Message(messageData);
                await newMessage.save();

                // Update chat
                await Chat.findByIdAndUpdate(chatId, {
                    lastMessage: newMessage._id,
                    lastActivity: new Date(),
                    $inc: { unreadMessageCount: 1 }
                });

                // Populate message details
                populatedMessage = await Message.findById(newMessage._id)
                    .populate('sender', 'firstname lastname profilePic')
                    .populate('replyTo', 'content.text sender');
            }

            // Ensure content structure is properly formatted for Socket.io
            if (populatedMessage.content && typeof populatedMessage.content === 'object') {
                // Content is already properly structured
                console.log(`📹 Broadcasting ${messageType} message with content:`, populatedMessage.content);
            } else {
                // Convert legacy content to object structure
                populatedMessage.content = {
                    text: populatedMessage.content || '',
                    image: populatedMessage.image || '',
                    video: populatedMessage.video || ''
                };
                console.log(`📹 Broadcasting ${messageType} message with converted content:`, populatedMessage.content);
            }

            const messagePayload = populatedMessage.toJSON ? populatedMessage.toJSON() : populatedMessage;

            // Broadcast to all other users in chat room
            socket.to(roomId).emit('receive-message', messagePayload);

            // Send to specific user's personal rooms if they're not in chat room
            for (const memberId of chat.members) {
                if (memberId.toString() !== userId) {
                    this.io.to(`user:${memberId}`).emit('new-message-notification', {
                        chatId,
                        message: messagePayload,
                        chat: {
                            _id: chat._id,
                            name: chat.name,
                            isGroup: chat.isGroup
                        }
                    });
                }
            }

            console.log(`💬 Message sent in room ${roomId} by ${socket.user.firstname}`);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    }

    /**
     * Handle marking messages as read
     */
    async handleMarkMessagesRead(socket, data) {
        const { chatId } = data;
        const userId = socket.userId;
        const roomId = `chat:${chatId}`;

        try {
            // Mark unread messages as read
            const result = await Message.updateMany(
                {
                    chatId,
                    sender: { $ne: userId },
                    'readBy.user': { $ne: userId },
                    isDeleted: false
                },
                {
                    $push: {
                        readBy: {
                            user: userId,
                            readAt: new Date()
                        }
                    }
                }
            );

            if (result.modifiedCount > 0) {
                // Update chat unread count
                const unreadCount = await Message.countDocuments({
                    chatId,
                    sender: { $ne: userId },
                    'readBy.user': { $ne: userId },
                    isDeleted: false
                });

                await Chat.findByIdAndUpdate(chatId, {
                    unreadMessageCount: unreadCount
                });

                // Notify other users in chat
                socket.to(roomId).emit('messages-read', {
                    chatId,
                    userId,
                    readCount: result.modifiedCount,
                    unreadCount
                });

                console.log(`📖 Messages marked as read in room ${roomId} by ${socket.user.firstname}`);
            }

        } catch (error) {
            console.error('Error marking messages as read:', error);
            socket.emit('error', { message: 'Failed to mark messages as read' });
        }
    }

    /**
     * Handle user typing indicator
     */
    handleUserTyping(socket, data) {
        const { chatId } = data;
        const userId = socket.userId;
        const roomId = `chat:${chatId}`;

        // Clear existing timeout for this user
        if (this.typingUsers.has(roomId)) {
            const userTimeouts = this.typingUsers.get(roomId);
            if (userTimeouts.has(userId)) {
                clearTimeout(userTimeouts.get(userId));
            }
        } else {
            this.typingUsers.set(roomId, new Map());
        }

        // Set new timeout to stop typing after 3 seconds
        const timeout = setTimeout(() => {
            this.handleUserStopTyping(socket, { chatId });
        }, 3000);

        this.typingUsers.get(roomId).set(userId, timeout);

        // Notify other users in room
        socket.to(roomId).emit('user-typing', {
            chatId,
            user: {
                id: socket.user._id,
                firstname: socket.user.firstname,
                lastname: socket.user.lastname
            }
        });
    }

    /**
     * Handle user stopped typing
     */
    handleUserStopTyping(socket, data) {
        const { chatId } = data;
        const userId = socket.userId;
        const roomId = `chat:${chatId}`;

        // Clear timeout
        if (this.typingUsers.has(roomId)) {
            const userTimeouts = this.typingUsers.get(roomId);
            if (userTimeouts.has(userId)) {
                clearTimeout(userTimeouts.get(userId));
                userTimeouts.delete(userId);
            }
        }

        // Notify other users in room
        socket.to(roomId).emit('user-stop-typing', {
            chatId,
            user: {
                id: socket.user._id,
                firstname: socket.user.firstname,
                lastname: socket.user.lastname
            }
        });
    }

    /**
     * Handle message deletion
     */
    async handleDeleteMessage(socket, data) {
        const { messageId } = data;
        const userId = socket.userId;

        try {
            const message = await Message.findById(messageId);

            if (!message) {
                socket.emit('error', { message: 'Message not found' });
                return;
            }

            // Check if user is the sender
            if (message.sender.toString() !== userId) {
                socket.emit('error', { message: 'Only message sender can delete message' });
                return;
            }

            // Soft delete message
            await Message.findByIdAndUpdate(messageId, {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId
            });

            const roomId = `chat:${message.chatId}`;

            // Check if message was unread
            const wasUnread = !message.readBy || message.readBy.length === 0;

            // Now, find the new last message for this chat to update global states
            const newLastMessage = await Message.findOne({
                chatId: message.chatId,
                isDeleted: false
            }).sort({ createdAt: -1 })
            .populate('sender', 'firstname lastname profilePic')
            .populate('replyTo', 'content.text sender');

            await Chat.findByIdAndUpdate(message.chatId, {
                lastMessage: newLastMessage ? newLastMessage._id : null
            });

            // Notify all users in chat
            this.io.to(roomId).emit('message-deleted-update', {
                messageId,
                chatId: message.chatId,
                wasUnread: wasUnread,
                newLastMessage: newLastMessage ? newLastMessage.toObject() : null
            });
            this.io.to(roomId).emit('message-deleted', {
                messageId,
                chatId: message.chatId,
                wasUnread: wasUnread,
                newLastMessage: newLastMessage ? newLastMessage.toObject() : null
            });

            console.log(`🗑️ Message deleted by ${socket.user.firstname}`);

        } catch (error) {
            console.error('Error deleting message:', error);
            socket.emit('error', { message: 'Failed to delete message' });
        }
    }

    /**
     * Handle message editing
     */
    async handleEditMessage(socket, data) {
        const { messageId, text } = data;
        const userId = socket.userId;

        try {
            const message = await Message.findById(messageId);

            if (!message) {
                socket.emit('error', { message: 'Message not found' });
                return;
            }

            // Only text messages can be edited
            if (message.messageType !== 'text') {
                socket.emit('error', { message: 'Only text messages can be edited' });
                return;
            }

            // Check if user is the sender
            if (message.sender.toString() !== userId) {
                socket.emit('error', { message: 'Only message sender can edit message' });
                return;
            }

            // Update message
            const updatedMessage = await Message.findByIdAndUpdate(messageId, {
                'content.text': text.trim(),
                isEdited: true,
                editedAt: new Date()
            }, { new: true })
            .populate('sender', 'firstname lastname profilePic')
            .populate('replyTo', 'content.text sender');

            const roomId = `chat:${message.chatId}`;

            // Notify all users in chat
            this.io.to(roomId).emit('message-edited', updatedMessage);

            console.log(`✏️ Message edited by ${socket.user.firstname}`);

        } catch (error) {
            console.error('Error editing message:', error);
            socket.emit('error', { message: 'Failed to edit message' });
        }
    }

    /**
     * Handle adding reaction
     */
    async handleAddReaction(socket, data) {
        const { messageId, emoji } = data;
        const userId = socket.userId;

        try {
            const message = await Message.findById(messageId);

            if (!message) {
                socket.emit('error', { message: 'Message not found' });
                return;
            }

            // Add reaction
            await Message.findByIdAndUpdate(messageId, {
                $pull: { reactions: { user: userId } },
                $push: {
                    reactions: {
                        user: userId,
                        emoji: emoji,
                        createdAt: new Date()
                    }
                }
            });

            // Get updated reactions
            const updatedMessage = await Message.findById(messageId)
                .populate('reactions.user', 'firstname lastname');

            const roomId = `chat:${message.chatId}`;

            // Notify all users in chat
            this.io.to(roomId).emit('reaction-added', {
                messageId,
                reactions: updatedMessage.reactions
            });

            console.log(`😊 Reaction added by ${socket.user.firstname}`);

        } catch (error) {
            console.error('Error adding reaction:', error);
            socket.emit('error', { message: 'Failed to add reaction' });
        }
    }

    /**
     * Handle removing reaction
     */
    async handleRemoveReaction(socket, data) {
        const { messageId } = data;
        const userId = socket.userId;

        try {
            const message = await Message.findById(messageId);

            if (!message) {
                socket.emit('error', { message: 'Message not found' });
                return;
            }

            // Remove reaction
            await Message.findByIdAndUpdate(messageId, {
                $pull: { reactions: { user: userId } }
            });

            const roomId = `chat:${message.chatId}`;

            // Notify all users in chat
            this.io.to(roomId).emit('reaction-removed', {
                messageId,
                userId
            });

            console.log(`😌 Reaction removed by ${socket.user.firstname}`);

        } catch (error) {
            console.error('Error removing reaction:', error);
            socket.emit('error', { message: 'Failed to remove reaction' });
        }
    }

    /**
     * Handle socket disconnection
     */
    handleDisconnection(socket) {
        const userId = socket.userId;
        const socketId = socket.id;

        console.log(`🔌 User disconnected: ${socket.user.firstname} (${socketId})`);

        // Remove from online users tracking
        this.onlineUsers.delete(socketId);

        // Remove from user sockets tracking
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).delete(socketId);
            
            // If user has no more active sockets, mark as offline
            if (this.userSockets.get(userId).size === 0) {
                this.userSockets.delete(userId);
                this.updateUserOnlineStatus(userId, false);
                this.emitUserOnlineStatus(userId, false);
            }
        }

        // Clean up typing indicators
        this.typingUsers.forEach((userTimeouts, roomId) => {
            if (userTimeouts.has(userId)) {
                clearTimeout(userTimeouts.get(userId));
                userTimeouts.delete(userId);
            }
        });

        // Emit updated online users list
        this.emitOnlineUsers();
    }

    /**
     * Update user's online status in database
     */
    async updateUserOnlineStatus(userId, isOnline) {
        try {
            await User.findByIdAndUpdate(userId, {
                isOnline: isOnline,
                lastSeen: isOnline ? undefined : new Date()
            });
        } catch (error) {
            console.error('Error updating user online status:', error);
        }
    }

    /**
     * Emit online users list
     */
    emitOnlineUsers() {
        const onlineUserIds = Array.from(this.userSockets.keys());
        console.log('🟢 Emitting online users:', onlineUserIds);
        this.io.emit('online-users', onlineUserIds);
    }

    /**
     * Emit user online status change
     */
    emitUserOnlineStatus(userId, isOnline) {
        this.io.emit('last-seen-update', {
            userId,
            isOnline,
            lastSeen: new Date()
        });
    }

    /**
     * Get online users count
     */
    getOnlineUsersCount() {
        return this.userSockets.size;
    }

    /**
     * Get room users count
     */
    getRoomUsersCount(roomId) {
        return this.roomUsers.get(roomId)?.size || 0;
    }

    /**
     * Send notification to specific user
     */
    sendToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Send to room
     */
    sendToRoom(roomId, event, data) {
        this.io.to(`chat:${roomId}`).emit(event, data);
    }

    /**
     * Broadcast to all connected users
     */
    broadcast(event, data) {
        this.io.emit(event, data);
    }
}

// Create and export singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;
