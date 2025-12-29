import { axiosInstance, url } from "./index.js";
export const getLoggedUser=async ()=>{
    try{
        const response=await axiosInstance.get(url+'/api/user/get-logged-user');
        return response.data;
    }
    catch(err){
        return err;
    };
};
export const getAllUsers=async ()=>{
    try{
        const response=await axiosInstance.get(url+'/api/user/get-all-users');
        return response.data;
    }
    catch(err){
        return err;
    };
};