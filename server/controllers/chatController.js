const Chat = require('../models/chat');
const Message = require('../models/message');
const asyncHandler = require('../middleware/asyncHandler');

// Create new chat
const createNewChat = asyncHandler(async (req, res) => {
    const { members, name, isGroup = false } = req.body;
    const userId = req.user._id;
    console.log('Creating chat with members:', members); 
    console.log('User ID:', userId);
    // Validate and clean members array
    if (!members || !Array.isArray(members)) {
        return res.status(400).json({
            success: false,
            message: 'Members array is required'
        });
    }

    // Filter out null, undefined, and empty values
    const cleanMembers = members
        .filter(member => member && member.trim() !== '')
        .map(member => member.trim())
        .filter((member, index, arr) => arr.indexOf(member) === index); // Remove duplicates

    if (cleanMembers.length < 1) {
        return res.status(400).json({
            success: false,
            message: 'At least one valid member is required'
        });
    }

    // Prevent users from chatting with themselves
    if (!isGroup && cleanMembers.length === 1 && cleanMembers[0] === userId.toString()) {
        return res.status(400).json({
            success: false,
            message: 'You cannot create a chat with yourself'
        });
    }

    // For private chats, ensure exactly 2 different users
    if (!isGroup) {
        if (cleanMembers.includes(userId.toString())) {
            // If current user is in members, ensure there's another user
            const otherMembers = cleanMembers.filter(member => member !== userId.toString());
            if (otherMembers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Private chat must include at least one other user'
                });
            }
        }
    }

    // Ensure current user is in members
    if (!cleanMembers.includes(userId.toString())) {
        cleanMembers.push(userId.toString());
    }

    console.log('Creating chat with members:', cleanMembers);

    // For private chats, check if chat already exists
    if (!isGroup) {
        // Check for existing private chat between these two users
        const existingChat = await Chat.findOne({
            members: { $all: cleanMembers, $size: 2 },
            isGroup: false
        }).populate('members', 'firstname lastname email profilePic createdAt');
        
        if (existingChat) {
            return res.json({
                success: true,
                message: 'Chat already exists',
                data: existingChat
            });
        }
    }

    // Create new chat
    const chatData = {
        members,
        isGroup,
        createdBy: userId
    };

    if (isGroup && name) {
        chatData.name = name;
    } else if (isGroup && !name) {
        // Generate group name from member names
        const users = await User.find({ _id: { $in: members } }).select('firstname lastname');
        chatData.name = users.map(u => `${u.firstname} ${u.lastname}`).join(', ');
    }

    const newChat = new Chat(chatData);
    await newChat.save();

    // Populate chat data
    const populatedChat = await Chat.findById(newChat._id)
        .populate('members', 'firstname lastname email profilePic createdAt')
        .populate('createdBy', 'firstname lastname');

    res.status(201).json({
        success: true,
        message: 'Chat created successfully',
        data: populatedChat
    });
});

// Get all chats for current user
const getAllChats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.find({
        members: userId,
        isActive: true
    })
    .populate('lastMessage', 'content messageType createdAt sender')
    .populate('members', 'firstname lastname email profilePic lastSeen isOnline createdAt')
    .populate('createdBy', 'firstname lastname')
    .sort({ lastActivity: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Chat.countDocuments({
        members: userId,
        isActive: true
    });

    res.json({
        success: true,
        message: 'Chats fetched successfully',
        data: chats,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// Get chat by ID
const getChatById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({
        _id: id,
        members: userId,
        isActive: true
    })
    .populate('lastMessage', 'content messageType createdAt sender')
    .populate('members', 'firstname lastname email profilePic lastSeen isOnline createdAt')
    .populate('createdBy', 'firstname lastname');

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    res.json({
        success: true,
        message: 'Chat fetched successfully',
        data: chat
    });
});

// Update chat details
const updateChat = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;

    const chat = await Chat.findOne({
        _id: id,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    // Only group chats can be updated
    if (!chat.isGroup) {
        return res.status(400).json({
            success: false,
            message: 'Only group chats can be updated'
        });
    }

    // Only creator can update group chat
    if (chat.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Only group creator can update chat details'
        });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const updatedChat = await Chat.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    )
    .populate('members', 'firstname lastname email profilePic createdAt')
    .populate('createdBy', 'firstname lastname');

    res.json({
        success: true,
        message: 'Chat updated successfully',
        data: updatedChat
    });
});

// Add members to group chat
const addMembers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { members } = req.body;
    const userId = req.user._id;

    if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Members array is required'
        });
    }

    const chat = await Chat.findOne({
        _id: id,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    // Only group chats can have members added
    if (!chat.isGroup) {
        return res.status(400).json({
            success: false,
            message: 'Cannot add members to private chat'
        });
    }

    // Only creator can add members
    if (chat.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Only group creator can add members'
        });
    }

    // Filter out existing members
    const newMembers = members.filter(memberId => !chat.members.includes(memberId));

    if (newMembers.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'All specified members are already in the chat'
        });
    }

    // Add new members
    const updatedChat = await Chat.findByIdAndUpdate(
        id,
        { $push: { members: { $each: newMembers } } },
        { new: true }
    )
    .populate('members', 'firstname lastname email profilePic createdAt')
    .populate('createdBy', 'firstname lastname');

    res.json({
        success: true,
        message: 'Members added successfully',
        data: updatedChat
    });
});

// Remove members from group chat
const removeMembers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { members } = req.body;
    const userId = req.user._id;

    if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Members array is required'
        });
    }

    const chat = await Chat.findOne({
        _id: id,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    // Only group chats can have members removed
    if (!chat.isGroup) {
        return res.status(400).json({
            success: false,
            message: 'Cannot remove members from private chat'
        });
    }

    // Only creator can remove members (or member can remove themselves)
    const isCreator = chat.createdBy.toString() === userId.toString();
    const isSelfRemoving = members.includes(userId.toString());

    if (!isCreator && !isSelfRemoving) {
        return res.status(403).json({
            success: false,
            message: 'Only group creator can remove members'
        });
    }

    // Cannot remove creator
    if (members.includes(chat.createdBy.toString())) {
        return res.status(400).json({
            success: false,
            message: 'Cannot remove group creator'
        });
    }

    // Remove members
    const updatedChat = await Chat.findByIdAndUpdate(
        id,
        { $pull: { members: { $in: members } } },
        { new: true }
    )
    .populate('members', 'firstname lastname email profilePic createdAt')
    .populate('createdBy', 'firstname lastname');

    res.json({
        success: true,
        message: 'Members removed successfully',
        data: updatedChat
    });
});

// Leave chat
const leaveChat = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({
        _id: id,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    // Cannot leave private chat, must delete it
    if (!chat.isGroup) {
        return res.status(400).json({
            success: false,
            message: 'Cannot leave private chat. Use delete instead.'
        });
    }

    // Creator cannot leave, must transfer ownership or delete
    if (chat.createdBy.toString() === userId.toString()) {
        return res.status(400).json({
            success: false,
            message: 'Group creator cannot leave. Transfer ownership or delete group.'
        });
    }

    // Remove user from chat
    const updatedChat = await Chat.findByIdAndUpdate(
        id,
        { $pull: { members: userId } },
        { new: true }
    )
    .populate('members', 'firstname lastname email profilePic createdAt')
    .populate('createdBy', 'firstname lastname');

    res.json({
        success: true,
        message: 'Left chat successfully',
        data: updatedChat
    });
});

// Delete chat
const deleteChat = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({
        _id: id,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    // For group chats, only creator can delete
    if (chat.isGroup && chat.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Only group creator can delete group chat'
        });
    }

    // Soft delete chat
    await Chat.findByIdAndUpdate(id, {
        isActive: false,
        deletedAt: new Date(),
        deletedBy: userId
    });

    res.json({
        success: true,
        message: 'Chat deleted successfully'
    });
});

// Clear unread messages
const clearUnreadMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findOne({
        _id: id,
        members: userId,
        isActive: true
    });

    if (!chat) {
        return res.status(404).json({
            success: false,
            message: 'Chat not found'
        });
    }

    // Mark all unread messages as read for this user
    await Message.updateMany(
        {
            chatId: id,
            sender: { $ne: userId },
            'readBy.user': { $ne: userId }
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

    // Reset unread count
    const updatedChat = await Chat.findByIdAndUpdate(
        id,
        { unreadMessageCount: 0 },
        { new: true }
    )
    .populate('members', 'firstname lastname email profilePic createdAt')
    .populate('lastMessage', 'content messageType createdAt sender');

    res.json({
        success: true,
        message: 'Unread messages cleared successfully',
        data: updatedChat
    });
});

module.exports = {
    createNewChat,
    getAllChats,
    getChatById,
    updateChat,
    addMembers,
    removeMembers,
    leaveChat,
    deleteChat,
    clearUnreadMessages
};
