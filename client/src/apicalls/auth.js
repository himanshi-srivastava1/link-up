import { axiosInstance, url } from "./index.js";
export const signupuser= async (user)=>{
    try{
       const response=await axiosInstance.post(url+'/api/auth/signup',user);
       return response.data;
    }
    catch(err){
        return err;
    };
};
export const loginuser= async (user)=>{
    try{
       const response=await axiosInstance.post(url+'/api/auth/login',user);
       return response.data;
    }
    catch(err){
        return err;
    };
};