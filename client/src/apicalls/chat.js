import { axiosInstance , url} from "./index.js";
export const getAllChats=async()=>{
    try{
         const response=await axiosInstance.get(`/api/chat/get-all-chats?t=${new Date().getTime()}`);
         return response.data;
    }
    catch(err){
        return err;
    }
};
export const createNewChat=async(members)=>{
    try{
         const response=await axiosInstance.post('/api/chat/create-new-chat',{members});
         return response.data;
    }
    catch(err){
        return err;
    }
};

export const clearUnreadMessageCount=async(chatId)=>{
    try{
         const response=await axiosInstance.post('/api/chat/clear-unread-messages',{chatId});
         return response.data;
    }
    catch(err){
        return err;
    }
};
