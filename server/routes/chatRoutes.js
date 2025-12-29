const router=require("express").Router();
const Chat=require('../models/chat.js');
const Message=require('../models/message.js');
const authMiddleware=require('../middlewares/authMiddleware');
router.post('/create-new-chat',authMiddleware, async(req,res)=>{
    try{
      const chat=new Chat(req.body);
      const savedChat= await chat.save();
      await savedChat.populate('members');
      res.status(201).send({
        message:"Chat created successfully",
        success:true,
        data:savedChat
      });
    }
    catch(err){
        res.send({
            message:err.message,
            success:false
        });
    };
});
router.get('/get-all-chats',authMiddleware, async(req,res)=>{
    try{
      const allChats=await Chat.find({members:{$in: req.userId}})
                               .populate('lastMessage')
                               .populate('members')
                               .sort({updatedAt:-1});
      res.send({
        message:"Chat fetched successfully",
        success: true,
        data: allChats
      });
    }
    catch(err){
        res.send({
            message:err.message,
            success:false
        });
    };
});
router.post('/clear-unread-messages', authMiddleware, async(req,res)=>{
    try{
        const chatId=req.body.chatId;
        const chat=await Chat.findById(chatId);
        if(chat){
          const updatedChat=await Chat.findByIdAndUpdate(chatId, {unreadMessageCount:0}, {new:true})
                                       .populate('members')
                                       .populate('lastMessage');
          await Message.updateMany({ chatId: chatId, read:false},{read:true})
          res.send({
            message:"Unread message cleared successfully.",
            success:true,
            data:updatedChat
          })
        }
        else{
          res.send({
            message:"Chat not found", 
            success:false
          })
        }
    }
    catch(err){
         res.send({
           message:err.message,
           success:false
         })
    };
});
module.exports=router;