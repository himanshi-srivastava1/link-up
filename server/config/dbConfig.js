const mongoose=require('mongoose');

console.log("Connecting to database with URI:", process.env.CONN_STRING ? "URI_FOUND" : "URI_UNDEFINED");

mongoose.connect(process.env.CONN_STRING);

const db=mongoose.connection;
db.on('connected',()=>{
    console.log("db connection successful");
});
db.on('error',(err)=>{
    console.error("db connection failed:", err);
});
db.on('disconnected',()=>{
    console.log("db disconnected");
});

module.exports=db;
