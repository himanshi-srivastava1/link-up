const router = require("express").Router();
const { authenticate } = require('../middleware/auth');
const {
    createNewChat,
    getAllChats,
    getChatById,
    updateChat,
    addMembers,
    removeMembers,
    leaveChat,
    deleteChat,
    clearUnreadMessages
} = require('../controllers/chatController');
const asyncHandler = require('../middleware/asyncHandler');

// Create new chat
router.post('/create-new-chat', authenticate, asyncHandler(createNewChat));

// Get all chats for current user
router.get('/get-all-chats', authenticate, asyncHandler(getAllChats));

// Get chat by ID
router.get('/:id', authenticate, asyncHandler(getChatById));

// Update chat details (group chat only)
router.put('/:id', authenticate, asyncHandler(updateChat));

// Add members to group chat
router.post('/:id/add-members', authenticate, asyncHandler(addMembers));

// Remove members from group chat
router.post('/:id/remove-members', authenticate, asyncHandler(removeMembers));

// Leave chat
router.post('/:id/leave', authenticate, asyncHandler(leaveChat));

// Delete chat
router.delete('/:id', authenticate, asyncHandler(deleteChat));

// Clear unread messages
router.post('/:id/clear-unread', authenticate, asyncHandler(clearUnreadMessages));

module.exports = router;