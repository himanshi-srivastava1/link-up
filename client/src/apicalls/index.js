import axios from "axios";
export const url="https://localhost:3000";
export const axiosInstance=axios.create({
    headers:{
        authorization:`Bearer ${localStorage.getItem('token')}`
    }
});