const router = require('express').Router();
const bcrypt = require("bcrypt");
const User = require("../models/user.js");
const UnverifiedUser =require("../models/unverified_user.js")
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
router.post('/signup', async (req, res) => {
   try {
      if (!req.body.password || req.body.password.length < 8) {
         return res.send({
            message: "Password must be at least 8 characters long",
            success: false
         });
      }
      const user = await User.findOne({ email: req.body.email });
      if (user) {
         return res.send({ message: "User already exists", success: false });
      }
      const user1 = await UnverifiedUser.findOne({ email: req.body.email });
      if(!user1){
         return res.send({ message: "OTP Expired", success: false });
      }
      const isValid = await bcrypt.compare(req.body.otp, user1.resetOtp);
      if (!isValid) {
         return res.send({ message: "Invalid OTP", success: false });
      }
      const hashed_password = await bcrypt.hash(req.body.password, 10);
      req.body.password = hashed_password;
      const newUser = new User(req.body);
      console.log(newUser);
      await newUser.save();
      res.status(201).send({
         message: "User created successfully",
         success: true,
      });
   }
   catch (error) {
      res.send({
         message: error.message,
         success: false
      }
      );
   };
});
router.post('/login', async (req, res) => {
   try {
      const user = await User.findOne({ email: req.body.email }).select("+password");;
      if (!user) {
         return res.send({
            message: "User does not exist",
            success: false
         });
      }
      const isValid = await bcrypt.compare(req.body.password, user.password);
      if (!isValid) {
         return res.send({
            message: "Invalid user password.",
            success: false
         });
      }
      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });
      res.send({
         message: "User logged in successfully",
         success: true,
         token: token
      });
   }
   catch (err) {
      res.send({
         message: err.message,
         success: false
      })
   };
});

router.post('/send-otp', async (req, res) => {
   try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
         return res.send({ message: "User does not exist", success: false });
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); 
      const hashed_otp = await bcrypt.hash(otp, 10);


      user.resetOtp = hashed_otp;
      user.resetOtpExpiry = expiry;
      await user.save();

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
         const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
               user: process.env.EMAIL_USER,
               pass: process.env.EMAIL_PASS
            }
         });
         const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.body.email,
            subject: 'LinkUp - Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
         };
         await transporter.sendMail(mailOptions);
      } else {
         console.log("MOCK OTP EMAIL:", otp);
      }

      res.send({ message: "OTP sent successfully to your email", success: true });
   } catch (err) {
      res.send({ message: err.message, success: false });
   }
});

router.post('/sign-up/send-otp', async (req, res) => {
   try {
      const { email } = req.body;
      const user = await User.findOne({ email: req.body.email });
      console.log(user);
      if (user) {
         return res.send({ message: "User already exists", success: false });
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); 
      console.log(otp);
      const hashed_otp=await bcrypt.hash(otp, 10);
      await UnverifiedUser.findOneAndUpdate(
         { email: email },
         { 
            resetOtp: hashed_otp, 
            resetOtpExpiry: expiry 
         },
         { upsert: true, new: true }
      );

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
         const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
               user: process.env.EMAIL_USER,
               pass: process.env.EMAIL_PASS
            }
         });
         const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.body.email,
            subject: 'LinkUp - Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`
         };
         await transporter.sendMail(mailOptions);
      } else {
         console.log("MOCK OTP EMAIL:", otp);
      }

      res.send({ message: "OTP sent successfully to your email", success: true });
   } catch (err) {
      res.send({ message: err.message, success: false });
   }
});


router.post('/reset-password', async (req, res) => {
   try {
      const user = await User.findOne({ email: req.body.email }).select("+password");
      if (!user) {
         return res.send({ message: "User does not exist", success: false });
      }
      const isValid = await bcrypt.compare(req.body.otp, user.resetOtp);
      if (!isValid) {
         return res.send({ message: "Invalid OTP", success: false });
      }

      if (user.resetOtpExpiry < Date.now()) {
         return res.send({ message: "OTP has expired. Please request a new one.", success: false });
      }

      if (req.body.password.length < 8) {
         return res.send({ message: "Password must be at least 8 characters long", success: false });
      }

      const hashed_password = await bcrypt.hash(req.body.password, 10);
      user.password = hashed_password;
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      await user.save();

      res.send({ message: "Password reset successful! You may now login.", success: true });
   } catch (err) {
      res.send({ message: err.message, success: false });
   }
});

module.exports = router; 