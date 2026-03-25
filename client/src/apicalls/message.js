import { axiosInstance, url } from "./index.js";
export const createNewMessage=async(message)=>{
    try{
         const response=await axiosInstance.post('/api/message/new-message', message);
         return response.data;
    }
    catch(err){
        return err;
    }
};
export const getAllMessages=async(chatId)=>{
    try{
         const response=await axiosInstance.get(`/api/message/get-all-messages/${chatId}`);
         return response.data;
    }
    catch(err){
        return err;
    }
};

export const deleteMessage = async (messageId) => {
    try {
        const response = await axiosInstance.delete(`/api/message/delete-message/${messageId}`);
        return response.data;
    } catch (err) {
        return err;
    }
};
