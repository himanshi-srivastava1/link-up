const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const Chat = require('../models/chat.js');
const Message = require('../models/message.js');
const cloudinary = require('../cloudinary.js');

router.post('/new-message', authMiddleware, async (req, res) => {
    try {
        if (req.body.image) {
            const uploadedImage = await cloudinary.uploader.upload(req.body.image, {
                folder: 'link-up-messages'
            });
            req.body.image = uploadedImage.secure_url;
        }

        if (req.body.video) {
            const uploadedVideo = await cloudinary.uploader.upload(req.body.video, {
                folder: 'link-up-messages',
                resource_type: "video"
            });
            req.body.video = uploadedVideo.secure_url;
        }

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
            message: err.message || (err.error && err.error.message) || err.name || "Upload failed: Unknown empty error",
            success: false
        });
    }
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
    catch (err) {
        res.send({
            message: err.message,
            success: false
        });
    }
});

router.delete('/delete-message/:id', authMiddleware, async (req, res) => {
    try {
        const messageToDelete = await Message.findById(req.params.id);
        if (!messageToDelete) {
             return res.send({ message: "Message not found", success: false });
        }
        
        const wasUnread = !messageToDelete.read;
        const deletedMessage = await Message.findByIdAndDelete(req.params.id);

        if (wasUnread) {
            await Chat.findByIdAndUpdate(messageToDelete.chatId, {
                $inc: { unreadMessageCount: -1 }
            });
        }

        res.send({
            message: "Message deleted successfully",
            success: true,
            data: deletedMessage
        });
    }
    catch (err) {
        res.send({
            message: err.message || "Error deleting message",
            success: false
        });
    }
});

module.exports = router;
