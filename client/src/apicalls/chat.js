import { axiosInstance , url} from "./index.js";
export const getAllChats=async()=>{
    try{
         const response=await axiosInstance.get(url+'/api/chat/get-all-chats');
         return response.data;
    }
    catch(err){
        return err;
    }
};
export const createNewChat=async(members)=>{
    try{
         const response=await axiosInstance.post(url+ '/api/chat/create-new-chat',{members});
         return response.data;
    }
    catch(err){
        return err;
    }
};

export const clearUnreadMessageCount=async(chatId)=>{
    try{
         const response=await axiosInstance.post(url+ '/api/chat/clear-unread-messages',{chatId});
         return response.data;
    }
    catch(err){
        return err;
    }
};
