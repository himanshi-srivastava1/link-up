import axios from "axios";
export const url="https://link-up-server2.onrender.com";
export const axiosInstance=axios.create({
    headers:{
        authorization:`Bearer ${localStorage.getItem('token')}`
    }
});