const dotenv=require("dotenv");
dotenv.config({path: './.env'});
const dbConfig=require('./config/dbConfig.js');
const server=require('./app.js');
const port=(process.env.PORT_NUMBER||3001);
server.listen(port,()=>{
    console.log(`listening... on port ${port}`);
});
