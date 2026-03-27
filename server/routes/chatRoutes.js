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


router.post('/create-new-chat', authenticate, asyncHandler(createNewChat));


router.get('/get-all-chats', authenticate, asyncHandler(getAllChats));


router.get('/:id', authenticate, asyncHandler(getChatById));


router.put('/:id', authenticate, asyncHandler(updateChat));


router.post('/:id/add-members', authenticate, asyncHandler(addMembers));


router.post('/:id/remove-members', authenticate, asyncHandler(removeMembers));


router.post('/:id/leave', authenticate, asyncHandler(leaveChat));


router.delete('/:id', authenticate, asyncHandler(deleteChat));


router.post('/:id/clear-unread', authenticate, asyncHandler(clearUnreadMessages));


module.exports = router;