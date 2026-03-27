import { axiosInstance } from "./index.js";

// Register new user
export const registerUser = async (userData) => {
    try {
        const response = await axiosInstance.post('/api/auth/register', userData);
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Registration failed' };
    }
};

// Login user
export const loginUser = async (credentials) => {
    try {
        const response = await axiosInstance.post('/api/auth/login', credentials);
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Login failed' };
    }
};

// Logout user
export const logoutUser = async () => {
    try {
        const response = await axiosInstance.post('/api/auth/logout');
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Logout failed' };
    }
};

// Get current user
export const getCurrentUser = async () => {
    try {
        const response = await axiosInstance.get('/api/auth/current-user');
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Failed to get user' };
    }
};

// Change password
export const changePassword = async (passwordData) => {
    try {
        const response = await axiosInstance.post('/api/auth/change-password', passwordData);
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Password change failed' };
    }
};

// Refresh token
export const refreshToken = async () => {
    try {
        const response = await axiosInstance.post('/api/auth/refresh-token');
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Token refresh failed' };
    }
};

// Verify email
export const verifyEmail = async (token) => {
    try {
        const response = await axiosInstance.get(`/api/auth/verify-email/${token}`);
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Email verification failed' };
    }
};

// Forgot password
export const forgotPassword = async (email) => {
    try {
        const response = await axiosInstance.post('/api/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Forgot password failed' };
    }
};

// Reset password
export const resetPassword = async (token, password) => {
    try {
        const response = await axiosInstance.post(`/api/auth/reset-password/${token}`, { password });
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Password reset failed' };
    }
};

// Resend email verification
export const resendEmailVerification = async (email) => {
    try {
        const response = await axiosInstance.post('/api/auth/resend-email-verification', { email });
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Resend verification failed' };
    }
};

// Resend verification email
export const resendVerificationEmail = async (email) => {
    try {
        const response = await axiosInstance.post('/api/auth/resend-verification-email', { email });
        return response.data;
    } catch (error) {
        return error.response?.data || { success: false, message: 'Resend verification email failed' };
    }
};

// Legacy functions for backward compatibility
export const signupuser = registerUser;
export const loginuser = loginUser;
export const sendOtpApi = forgotPassword;
export const resetPasswordApi = resetPassword;