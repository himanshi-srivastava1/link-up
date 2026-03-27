const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
    newMessage,
    getAllMessages,
    deleteMessage,
    editMessage,
    markMessagesAsRead,
    addReaction,
    removeReaction,
    getMessageById
} = require("../controllers/messageController");
const asyncHandler = require('../middleware/asyncHandler');

// Send new message
router.post('/new-message', authenticate, asyncHandler(newMessage));

// Get all messages for a chat
router.get('/get-all-messages/:chatId', authenticate, asyncHandler(getAllMessages));

// Delete message
router.delete('/delete-message/:id', authenticate, asyncHandler(deleteMessage));

// Edit message
router.put('/edit-message/:id', authenticate, asyncHandler(editMessage));

// Mark messages as read
router.post('/mark-read/:chatId', authenticate, asyncHandler(markMessagesAsRead));

// Add reaction to message
router.post('/add-reaction/:id', authenticate, asyncHandler(addReaction));

// Remove reaction from message
router.post('/remove-reaction/:id', authenticate, asyncHandler(removeReaction));

// Get message by ID
router.get('/:id', authenticate, asyncHandler(getMessageById));

module.exports = router;
