const mongoose=require('mongoose');
mongoose.connect(process.env.CONN_STRING);
const db=mongoose.connection;
db.on('connected',()=>{
    console.log("db connection successful");
});
db.on('err',()=>{
    console.log("db connection failed");
});
module.exports=db;