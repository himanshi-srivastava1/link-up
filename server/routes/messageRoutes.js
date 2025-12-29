const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const Chat = require('../models/chat.js');
const Message = require('../models/message.js');
router.post('/new-message', authMiddleware, async (req, res) => {
    try {
        const newMessage = new Message(req.body);
        const savedMessage = await newMessage.save();
        const savedChat = await Chat.findByIdAndUpdate(
            req.body.chatId, {
                lastMessage: savedMessage._id,
            $inc: { unreadMessageCount: 1 }
        });
        res.status(201).send({
            message: "Message Sent Successfully",
            success: true,
            data: savedMessage
        });
    }
    catch (err) {
        res.send({
            message: err.message,
            success: false
        });
    };
});
router.get('/get-all-messages/:chatId', authMiddleware, async (req, res) => {
    try {
        const allMessages = await Message.find({ chatId: req.params.chatId })
            .sort({ createdAt: 1 });
        res.send({
            message: "Messages fetched successfully",
            success: true,
            data: allMessages
        });
    }
    catch(err){
         res.send({
            message:err.message,
            success: false
         });
    };
    
});
module.exports = router;
