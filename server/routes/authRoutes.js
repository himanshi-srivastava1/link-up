const router=require('express').Router();
const bcrypt= require("bcrypt");
const User=require("../models/user.js");
const jwt=require("jsonwebtoken");
router.post('/signup',async (req,res)=>{
   try{
      if (!req.body.password || req.body.password.length < 8) {
         return res.send({ 
            message: "Password must be at least 8 characters long", 
            success: false 
         });
      }
      const user= await User.findOne({email:req.body.email});
      if(user){
         return res.send({message: "User already exists", success: false});
      }
      const hashed_password= await bcrypt.hash(req.body.password,10);
      req.body.password=hashed_password;
      const newUser=new User(req.body);
      await newUser.save();
      res.status(201).send({
         message:"User created successfully",
         success:true
      });
   }
   catch(error){
      res.send({
        message:error.message,
        success: false
      }
      );
   };
});
router.post('/login',async(req,res)=>{
   try{
      const user=await User.findOne({email:req.body.email}).select("+password");;
      if(!user){
         return res.send({
            message:"User does not exist",
            success: false
         });
      }
      const isValid=await bcrypt.compare(req.body.password,user.password);
      if(!isValid){
         return res.send({
            message:"Invalid user password.",
            success:false
         });
      }
      const token=jwt.sign({userId:user._id},process.env.SECRET_KEY,{expiresIn:"1d"});
      res.send({
         message:"User logged in successfully",
         success: true,
         token:token
      });
   }
   catch(err){
       res.send({
         message:err.message,
         success:false
       })
   };
});
module.exports=router;