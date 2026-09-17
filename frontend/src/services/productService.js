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

export const uploadProductImages = async (files, token) => {
    try {
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('images', file);
        });
        const headers = {
            'Content-Type': 'multipart/form-data'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios.post(`${API_URL}/products/upload-images`, formData, {
            headers,
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi khi tải ảnh lên Cloudflare R2');
    }
};

export const updateProduct = async (id, productData, token) => {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios.put(`${API_URL}/products/product/${id}`, productData, {
            headers,
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi khi cập nhật sản phẩm');
    }
};

export const deleteProduct = async (id, token) => {
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await axios.delete(`${API_URL}/products/product/${id}`, {
            headers,
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Lỗi khi xóa sản phẩm');
    }
}; 