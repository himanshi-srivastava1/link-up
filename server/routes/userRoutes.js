const router=require("express").Router();
const User=require('../models/user.js');
const authMiddleware=require('../middlewares/authMiddleware');
const cloudinary=require('../cloudinary.js');
router.get('/get-logged-user', authMiddleware, async(req,res)=>{
    try{
        const user=await User.findOne({_id:req.userId});
        if(user){
            res.send({
                message:"user fetched successfully",
                success:true,
                data:user
            });
        }
    }
    catch(err){
           res.status(400).send({
            message:err.message,
            success:false
           });
    };
});
router.get('/get-all-users', authMiddleware, async(req,res)=>{
    try{
        const id=req.userId;
        const allUsers=await User.find({_id:{$ne:id}});
        res.send({
            message:"users fetched successfully",
            success:true,
            data:allUsers
        });
    }
    catch(err){
           res.status(400).send({
            message:err.message,
            success:false
           });
    };
});
router.post('/upload-profile-pic', authMiddleware, async(req,res)=>{
    try{
        const image=req.body.image;
        const uploadedImage=await cloudinary.uploader.upload(image,
            {
                folder:'link-up'
            }
        );
        const updatedUser=await User.findByIdAndUpdate(req.userId, {profilePic: uploadedImage.secure_url},{new:true});
        res.send({
            message:"Profile photo updated successfully.",
            success:true,
            data:updatedUser
        });
    }
    catch(err){
        res.send({
            message:err.message,
            success:false
        })
    };
})
module.exports=router;