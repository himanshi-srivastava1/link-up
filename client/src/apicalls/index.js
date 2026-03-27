import axios from "axios";
export const url = process.env.REACT_APP_API_URL || (window.location.hostname === "localhost" ? "http://localhost:3002" : "");
export const axiosInstance = axios.create({
    baseURL: url,
});

// Add request interceptor to include token
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.authorization = `Bearer ${token}`;
    }
    return config;
});