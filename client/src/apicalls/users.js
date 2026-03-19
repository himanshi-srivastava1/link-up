import { axiosInstance, url } from "./index.js";
export const getLoggedUser=async ()=>{
    try{
        const response=await axiosInstance.get('/api/user/get-logged-user');
        return response.data;
    }
    catch(err){
        return err;
    };
};
export const getAllUsers=async ()=>{
    try{
        const response=await axiosInstance.get('/api/user/get-all-users');
        return response.data;
    }
    catch(err){
        return err;
    };
};
export const uploadProfilePic=async (image)=>{
    try{
        const response=await axiosInstance.post('/api/user/upload-profile-pic', {image});
        return response.data;
    }
    catch(err){
        return err;
    };
};