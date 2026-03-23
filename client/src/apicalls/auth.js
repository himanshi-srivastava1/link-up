import { axiosInstance, url } from "./index.js";
export const signupuser= async (user)=>{
    try{
       const response=await axiosInstance.post('/api/auth/signup',user);
       return response.data;
    }
    catch(err){
        return err;
    };
};
export const loginuser= async (user)=>{
    try{
       const response=await axiosInstance.post('/api/auth/login',user);
       return response.data;
    }
    catch(err){
        return err;
    };
};

export const sendOtpApi = async (email) => {
    try {
        const response = await axiosInstance.post('/api/auth/send-otp', { email });
        return response.data;
    } catch (err) {
        return err;
    }
};

export const sendOtpApiSignUp = async (email) => {
    try {
        const response = await axiosInstance.post('/api/auth/sign-up/send-otp', { email });
        return response.data;
    } catch (err) {
        return err;
    }
};

export const resetPasswordApi = async (user) => {
    try {
        const response = await axiosInstance.post('/api/auth/reset-password', user);
        return response.data;
    } catch (err) {
        return err;
    }
};