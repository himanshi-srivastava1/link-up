const Message = require('../models/message');
const Chat = require('../models/chat');
const cloudinary = require('../cloudinary');
const asyncHandler = require('../middleware/asyncHandler');

// Send new message
const newMessage = asyncHandler(async (req, res) => {
    const { chatId, content, messageType = 'text', replyTo } = req.body;
    const userId = req.user._id;

    // Validate chat exists and user is member
    const chat = await Chat.findOne({
        _id: chatId,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found or access denied'
        });
    }

    // Validate content based on message type
    let messageContent = {};

    switch (messageType) {
        case 'text':
            if (!content || !content.text || content.text.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Text content is required for text messages'
                });
            }
            messageContent.text = content.text.trim();
            break;

        case 'image':
            if (!content || !content.image) {
                return res.status(400).json({
                    success: false,
                    message: 'Image URL is required for image messages'
                });
            }
            // Upload image to Cloudinary if base64 provided
            if (content.image.startsWith('data:')) {
                const uploadedImage = await cloudinary.uploader.upload(content.image, {
                    folder: 'link-up/messages',
                    resource_type: 'auto'
                });
                messageContent.image = uploadedImage.secure_url;
            } else {
                messageContent.image = content.image;
            }
            break;

        case 'video':
            if (!content || !content.video) {
                return res.status(400).json({
                    success: false,
                    message: 'Video URL is required for video messages'
                });
            }
            // Upload video to Cloudinary if base64 provided
            if (content.video.startsWith('data:')) {
                const uploadedVideo = await cloudinary.uploader.upload(content.video, {
                    folder: 'link-up/messages',
                    resource_type: 'video'
                });
                messageContent.video = uploadedVideo.secure_url;
            } else {
                messageContent.video = content.video;
            }
            break;

        case 'file':
            if (!content || !content.file) {
                return res.status(400).json({
                    success: false,
                    message: 'File URL is required for file messages'
                });
            }
            // Upload file to Cloudinary if base64 provided
            if (content.file.startsWith('data:')) {
                const uploadedFile = await cloudinary.uploader.upload(content.file, {
                    folder: 'link-up/messages',
                    resource_type: 'auto'
                });
                messageContent.file = uploadedFile.secure_url;
            } else {
                messageContent.file = content.file;
            }
            break;

        default:
            return res.status(400).json({
                success: false,
                message: 'Invalid message type'
            });
    }

    // Validate replyTo if provided
    if (replyTo) {
        const replyMessage = await Message.findById(replyTo);
        if (!replyMessage || replyMessage.chatId.toString() !== chatId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reply message'
            });
        }
    }

    // Create message
    const messageData = {
        chatId,
        sender: userId,
        content: messageContent,
        messageType,
        replyTo
    };

    const newMessage = new Message(messageData);
    await newMessage.save();

    // Update chat's last message and activity
    await Chat.findByIdAndUpdate(chatId, {
        lastMessage: newMessage._id,
        lastActivity: new Date(),
        $inc: { unreadMessageCount: 1 }
    });

    // Populate message details
    const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'firstname lastname profilePic')
        .populate('replyTo', 'content.text sender');

    res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: populatedMessage
    });
});

// Get all messages for a chat
const getAllMessages = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;
    const userId = req.user._id;

    // Validate chat exists and user is member
    const chat = await Chat.findOne({
        _id: chatId,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found or access denied'
        });
    }

    // Build query
    let query = { chatId, isDeleted: false };

    // Add time-based filtering
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    } else if (after) {
        query.createdAt = { $gt: new Date(after) };
    }

    // Get messages with pagination
    const messages = await Message.find(query)
        .populate('sender', 'firstname lastname profilePic')
        .populate('replyTo', 'content.text sender')
        .populate('readBy.user', 'firstname lastname')
        .populate('reactions.user', 'firstname lastname')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    // Get total count
    const total = await Message.countDocuments(query);

    // Reverse order for chronological display
    const reversedMessages = messages.reverse();

    res.json({
        success: true,
        message: 'Messages fetched successfully',
        data: reversedMessages,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// Delete message
const deleteMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Only message sender can delete message'
        });
    }

    // Soft delete message
    await Message.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
    });

    // Update chat's last message if this was the last message
    const lastMessage = await Message.findOne({
        chatId: message.chatId,
        isDeleted: false
    }).sort({ createdAt: -1 });

    if (!lastMessage || lastMessage._id.toString() === id) {
        // Find the previous message
        const previousMessage = await Message.findOne({
            chatId: message.chatId,
            isDeleted: false,
            _id: { $ne: id }
        }).sort({ createdAt: -1 });

        await Chat.findByIdAndUpdate(message.chatId, {
            lastMessage: previousMessage ? previousMessage._id : null,
            lastActivity: new Date()
        });
    }

    res.json({
        success: true,
        message: 'Message deleted successfully',
        data: message
    });
});

// Edit message
const editMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Text content is required'
        });
    }

    const message = await Message.findById(id);

    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }

    // Only text messages can be edited
    if (message.messageType !== 'text') {
        return res.status(400).json({
            success: false,
            message: 'Only text messages can be edited'
        });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Only message sender can edit message'
        });
    }

    // Update message
    const updatedMessage = await Message.findByIdAndUpdate(id, {
        'content.text': text.trim(),
        isEdited: true,
        editedAt: new Date()
    }, { new: true })
    .populate('sender', 'firstname lastname profilePic')
    .populate('replyTo', 'content.text sender');

    res.json({
        success: true,
        message: 'Message updated successfully',
        data: updatedMessage
    });
});

// Mark messages as read
const markMessagesAsRead = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Validate chat exists and user is member
    const chat = await Chat.findOne({
        _id: chatId,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found or access denied'
        });
    }

    // Mark all unread messages as read
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

    res.json({
        success: true,
        message: 'Messages marked as read',
        data: {
            messagesRead: result.modifiedCount,
            unreadCount
        }
    });
});

// Add reaction to message
const addReaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji || emoji.length > 10) {
        return res.status(400).json({
            success: false,
            message: 'Valid emoji is required'
        });
    }

    const message = await Message.findById(id);

    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }

    // Remove existing reaction by this user and add new one
    await Message.findByIdAndUpdate(id, {
        $pull: { reactions: { user: userId } },
        $push: {
            reactions: {
                user: userId,
                emoji: emoji,
                createdAt: new Date()
            }
        }
    });

    // Get updated message
    const updatedMessage = await Message.findById(id)
        .populate('reactions.user', 'firstname lastname');

    res.json({
        success: true,
        message: 'Reaction added successfully',
        data: updatedMessage.reactions
    });
});

// Remove reaction from message
const removeReaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }

    // Remove reaction by this user
    await Message.findByIdAndUpdate(id, {
        $pull: { reactions: { user: userId } }
    });

    res.json({
        success: true,
        message: 'Reaction removed successfully'
    });
});

// Get message by ID
const getMessageById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id)
        .populate('sender', 'firstname lastname profilePic')
        .populate('replyTo', 'content.text sender')
        .populate('readBy.user', 'firstname lastname')
        .populate('reactions.user', 'firstname lastname');

    if (!message) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }

    // Check if user has access to this message
    const chat = await Chat.findOne({
        _id: message.chatId,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    }

    res.json({
        success: true,
        message: 'Message fetched successfully',
        data: message
    });
});

module.exports = {
    newMessage,
    getAllMessages,
    deleteMessage,
    editMessage,
    markMessagesAsRead,
    addReaction,
    removeReaction,
    getMessageById
};
