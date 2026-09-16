import axios from 'axios';

export const API_URL = process.env.API_URL;

axios.defaults.withCredentials = true;

export const register = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, userData, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const login = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, userData, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/auth/password/forgot`, { email }, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const resetPassword = async (token, password, confirmPassword) => {
    try {
        const response = await axios.post(`${API_URL}/auth/password/reset`, { token, password, confirmPassword }, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const logout = async () => {
    try {
        const response = await axios.get(`${API_URL}/auth/logout`, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getProfile = async () => {
    try {
        const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateProfile = async (userData) => {
    try {
        const response = await axios.put(`${API_URL}/auth/me/update`, userData, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updatePassword = async (passwordData) => {
    try {
        const response = await axios.put(`${API_URL}/auth/password/update`, passwordData, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const updateSettings = async (settingsData) => {
    try {
        const response = await axios.put(`${API_URL}/auth/settings/update`, settingsData, { withCredentials: true });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}; 