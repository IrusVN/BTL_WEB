import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../../services/authService.js';

export const useHeaderLogic = () => {
    const [user, setUser] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const userData = JSON.parse(atob(token.split('.')[1]));
            setUser(userData);
        }
    }, []);

    const toggleBrandDropdown = () => {
        setIsBrandDropdownOpen(!isBrandDropdownOpen);
    };

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('token');
            setUser(null);
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };
    
    const toggleSearch = () => {
        setShowSearch(!showSearch);
        if (showSearch) {
            setSearchTerm('');
        }
    };
    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
            setShowSearch(false);
        }
    };

    return {
        user,
        cartCount,
        isBrandDropdownOpen,
        showSearch,
        searchTerm,
        setSearchTerm,
        toggleBrandDropdown,
        toggleSearch,
        handleSearchSubmit,
        handleLogout
    };
};
