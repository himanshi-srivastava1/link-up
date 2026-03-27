const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadMessageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    archivedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastActivity: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: function() {
            return this.isGroup;
        }
    },
    isGroup: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
chatSchema.index({ members: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ 'lastMessage': 1 });

// Virtual for getting other user in 1-on-1 chat
chatSchema.virtual('otherMember', {
    ref: 'User',
    localField: 'members',
    foreignField: '_id',
    justOne: true,
    match: { $ne: this.userId }
});

// Method to get unread count for a specific user
chatSchema.methods.getUnreadCountForUser = function(userId) {
    // This would be implemented with message model
    return this.unreadMessageCount;
};

// Method to check if user is a member
chatSchema.methods.isUserMember = function(userId) {
    return this.members.some(member => member.toString() === userId.toString());
};

// Static method to find chats for a user
chatSchema.statics.findUserChats = function(userId, options = {}) {
    const query = { 
        members: userId,
        isActive: true 
    };
    
    return this.find(query)
        .populate('lastMessage')
        .populate('members', 'firstname lastname email profilePic')
        .sort({ lastActivity: -1 })
        .limit(options.limit || 50);
};

// Static method to find or create 1-on-1 chat
chatSchema.statics.findOrCreateOneOnOne = async function(userIds) {
    // Sort user IDs to ensure consistent ordering
    const sortedIds = userIds.sort();
    
    let chat = await this.findOne({
        members: { $all: sortedIds, $size: 2 }
    }).populate('members', 'firstname lastname email profilePic');
    
    if (!chat) {
        chat = await this.create({
            members: sortedIds
        });
        await chat.populate('members', 'firstname lastname email profilePic');
    }
    
    return chat;
};

module.exports = mongoose.model('Chat', chatSchema);