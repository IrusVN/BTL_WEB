import axios from 'axios';
import { API_URL } from './authService.js';

export const getProducts = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/products/products`, { params });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
};

export const getProductDetails = async (id) => {
    try {
        if (!id) throw new Error('ID sản phẩm không hợp lệ');
        const response = await axios.get(`${API_URL}/products/product/${id}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
};

export const getProductsByCategory = async (categoryId) => {
    try {
        const response = await axios.get(`${API_URL}/products/category/${categoryId}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
};

export const getProductSuggestions = async (q) => {
    try {
        const response = await axios.get(`${API_URL}/products/suggest`, { params: { q } });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi kết nối server');
    }
}; 