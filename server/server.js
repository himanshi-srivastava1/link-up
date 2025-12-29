const dotenv=require("dotenv");
dotenv.config({path:'./config.env'});
const dbConfig=require('./config/dbConfig.js');
const server=require('./app.js');
const port=(process.env.PORT_NUMBER||3000);
server.listen(port,()=>{
    console.log(`listening... on port ${port}`);
});
