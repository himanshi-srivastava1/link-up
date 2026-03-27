const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        text: {
            type: String,
            trim: true,
            maxlength: [2000, 'Message text cannot exceed 2000 characters']
        },
        image: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
                },
                message: 'Invalid image URL format'
            }
        },
        video: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^https?:\/\/.+\.(mp4|avi|mov|wmv|webm)$/i.test(v);
                },
                message: 'Invalid video URL format'
            }
        },
        file: {
            type: String,
            validate: {
                validator: function(v) {
                    return !v || /^https?:\/\/.+\.(pdf|doc|docx|txt|zip)$/i.test(v);
                },
                message: 'Invalid file URL format'
            }
        }
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'file'],
        default: 'text'
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        emoji: {
            type: String,
            required: true,
            maxlength: 10
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    metadata: {
        deviceInfo: String,
        ipAddress: String,
        userAgent: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'content.text': 'text' });
messageSchema.index({ messageType: 1 });
messageSchema.index({ readBy: 1 });
messageSchema.index({ isDeleted: 1 });

// Virtual for checking if message has content
messageSchema.virtual('hasContent').get(function() {
    return this.content.text || this.content.image || this.content.video || this.content.file;
});

// Virtual for message type based on content
messageSchema.virtual('actualMessageType').get(function() {
    if (this.content.image) return 'image';
    if (this.content.video) return 'video';
    if (this.content.file) return 'file';
    return 'text';
});

// Method to mark message as read by user
messageSchema.methods.markAsRead = function(userId) {
    const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());
    if (!alreadyRead) {
        this.readBy.push({ user: userId });
    }
    return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
    // Remove existing reaction by this user
    this.reactions = this.reactions.filter(reaction => reaction.user.toString() !== userId.toString());
    // Add new reaction
    this.reactions.push({ user: userId, emoji });
    return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
    this.reactions = this.reactions.filter(reaction => reaction.user.toString() !== userId.toString());
    return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newText) {
    if (this.messageType !== 'text') {
        throw new Error('Only text messages can be edited');
    }
    this.content.text = newText;
    this.isEdited = true;
    this.editedAt = new Date();
    return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function(userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
};

// Static method to get messages for chat with pagination
messageSchema.statics.getChatMessages = function(chatId, options = {}) {
    const {
        page = 1,
        limit = 50,
        before = null,
        after = null
    } = options;

    let query = { 
        chatId,
        isDeleted: false 
    };

    if (before) {
        query.createdAt = { $lt: new Date(before) };
    } else if (after) {
        query.createdAt = { $gt: new Date(after) };
    }

    return this.find(query)
        .populate('sender', 'firstname lastname profilePic')
        .populate('replyTo', 'content.text sender')
        .populate('readBy.user', 'firstname lastname')
        .populate('reactions.user', 'firstname lastname')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
};

// Static method to get unread message count for user in chat
messageSchema.statics.getUnreadCount = function(chatId, userId) {
    return this.countDocuments({
        chatId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId },
        isDeleted: false
    });
};

// Static method to get last message for chat
messageSchema.statics.getLastMessage = function(chatId) {
    return this.findOne({
        chatId,
        isDeleted: false
    })
    .populate('sender', 'firstname lastname profilePic')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Message', messageSchema);
