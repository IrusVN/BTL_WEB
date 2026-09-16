import axios from 'axios';
import { API_URL } from './authService.js';

export const getMyOrders = async () => {
    try {
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true
        };
        
        const response = await axios.get(`${API_URL}/orders/orders/me`, config);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
};

export const getOrderDetails = async (orderId) => {
    try {
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true
        };
        
        const response = await axios.get(`${API_URL}/orders/order/${orderId}`, config);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
};

export const createOrder = async (orderData) => {
    try {
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true
        };
        
        const response = await axios.post(`${API_URL}/orders/order/new`, orderData, config);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
};

export const cancelOrder = async (orderId) => {
    try {
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true
        };
        
        const response = await axios.put(`${API_URL}/orders/order/${orderId}/cancel`, {}, config);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
};

export const resendOrderConfirmationEmail = async (orderId) => {
    try {
        const token = localStorage.getItem('token');
        
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            withCredentials: true
        };
        
        const response = await axios.post(`${API_URL}/orders/order/${orderId}/resend-email`, {}, config);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
}; 