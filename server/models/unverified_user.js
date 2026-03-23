const mongoose=require('mongoose');
const unverifiedUserSchema=new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique:true,
    },
    resetOtp: {
        type: String,
        required: true
    },
    resetOtpExpiry: {
        type: Date,
        required: true,
        expires:1,
    }
}, { timestamps:true });
module.exports=mongoose.model('unverifiedUser',unverifiedUserSchema);
