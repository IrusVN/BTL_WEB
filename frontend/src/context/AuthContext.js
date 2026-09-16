import React, { createContext, useState, useContext, useEffect } from 'react';
import { getProfile, logout as logoutService } from '../services/authService.js';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (token) {
                    const response = await getProfile();
                    if (response.success) {
                        setUser(response.user);
                    } else {
                        setToken(null);
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error("Lỗi xác thực:", error);
                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [token]);

    const login = (userData, receivedToken) => {
        setUser(userData);
        setToken(receivedToken);
    };

    const logout = async () => {
        try {
            await logoutService();
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        } finally {
            setUser(null);
            setToken(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
}; 