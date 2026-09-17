import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import * as styles from './Admin.module.scss';
import { API_URL } from '../../services/authService.js';
import { uploadProductImages } from '../../services/productService.js';
import { useAuth } from '../../context/AuthContext.js';
import { showToast } from '../../components/Toast/index.js';
import QuickView from '../../components/QuickView/index.js';
import ImageLightbox from '../../components/ImageLightbox/index.js';
import ThemeToggle from '../../components/ThemeToggle/index.js';
import { useNavigate, useLocation } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faFileInvoice, faUsers, faSignOutAlt, faSearch, faPlus, faEye, faPencilAlt, faTrash, faTimes, faBars, faComments, faPaperPlane, faBox, faShieldAlt, faCrown, faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-home' },
    { id: 'products', label: 'Sản phẩm', icon: 'fas fa-box' },
    { id: 'categories', label: 'Danh mục', icon: 'fas fa-list' },
    { id: 'orders', label: 'Đơn hàng', icon: 'fas fa-shopping-cart' },
    { id: 'users', label: 'Người dùng', icon: 'fas fa-users' },
    { id: 'comments', label: 'Đánh giá', icon: 'fas fa-comments' },
    { id: 'chat', label: 'Hỗ trợ khách hàng', icon: 'fas fa-comment-dots' }
];

function Admin() {
    useHead('Quản trị');
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const queryTab = new URLSearchParams(location.search).get('tab');
    const initialTab = location.state?.activeTab || queryTab || 'dashboard';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Trạng thái loading cho các bảng dữ liệu
    const [loadingDashboard, setLoadingDashboard] = useState(initialTab === 'dashboard');
    const [loadingInvoices, setLoadingInvoices] = useState(initialTab === 'invoices');
    const [loadingProducts, setLoadingProducts] = useState(initialTab === 'products');
    const [loadingUsers, setLoadingUsers] = useState(initialTab === 'users');

    useEffect(() => {
        const tabParam = new URLSearchParams(location.search).get('tab');
        const targetTab = location.state?.activeTab || tabParam;
        if (targetTab) {
            if (targetTab === 'invoices') setLoadingInvoices(true);
            else if (targetTab === 'products') setLoadingProducts(true);
            else if (targetTab === 'users') setLoadingUsers(true);
            else if (targetTab === 'dashboard') setLoadingDashboard(true);
            setActiveTab(targetTab);
        }
    }, [location.search, location.state]);
    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        recentOrders: []
    });
    const [newProduct, setNewProduct] = useState({
        code: '',
        name: '',
        images: [],
        price: 0,
        description: '',
        stock: 10,
        category: '6418b95ee7644b19ba04ff83',
        brand: '',
        xuatXu: '',
        gioiTinh: '',
        mauSac: '',
        kieuDang: '',
        chatLieu: '',
        size: ''
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [priceSort, setPriceSort] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('');
    const [invoiceSort, setInvoiceSort] = useState('date-desc');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
        address: ''
    });

    const [showEditForm, setShowEditForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productImages, setProductImages] = useState([]);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    // Trạng thái phóng to ảnh Lightbox
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxTitle, setLightboxTitle] = useState('');
    const [lightboxSubtitle, setLightboxSubtitle] = useState('');

    const handleOpenLightbox = (product, initialIdx = 0) => {
        if (!product) return;
        let imgs = [];
        if (Array.isArray(product.images) && product.images.length > 0) {
            imgs = product.images;
        } else if (product.image) {
            imgs = [product.image];
        } else if (product.imageUrl) {
            imgs = [product.imageUrl];
        }

        if (imgs.length === 0) return;

        setLightboxImages(imgs);
        setLightboxIndex(initialIdx);
        setLightboxTitle(product.name || 'Chi tiết hình ảnh');
        setLightboxSubtitle(
            product.brand
                ? `${product.brand}${product.code ? ' • ' + product.code : ''}`
                : product.code || ''
        );
        setLightboxOpen(true);
    };
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem('admin_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newChatMessage, setNewChatMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [conversationSearchTerm, setConversationSearchTerm] = useState('');
    const messagesEndRef = React.useRef(null);

    const toggleCollapse = () => {
        setIsSidebarCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('admin_sidebar_collapsed', String(next));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(!isSidebarOpen);
        } else {
            toggleCollapse();
        }
    };

    const handleMenuItemClick = (tab) => {
        if (tab === 'invoices') setLoadingInvoices(true);
        else if (tab === 'products') setLoadingProducts(true);
        else if (tab === 'users') setLoadingUsers(true);
        else if (tab === 'dashboard') setLoadingDashboard(true);
        setActiveTab(tab);
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoadingDashboard(true);
            const ordersResponse = await axios.get(`${API_URL}/orders/admin/orders`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (ordersResponse.data.success) {
                setDashboardStats(prev => ({
                    ...prev,
                    totalOrders: ordersResponse.data.orders.length,
                    recentOrders: ordersResponse.data.orders.slice(0, 5)
                }));
                console.log('Orders data:', ordersResponse.data);
                setInvoices(ordersResponse.data.orders);
            }

            const productsResponse = await axios.get(`${API_URL}/products/products`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (productsResponse.data.success) {
                setDashboardStats(prev => ({
                    ...prev,
                    totalProducts: productsResponse.data.products.length
                }));
                console.log('Products data:', productsResponse.data);
                setProducts(productsResponse.data.products);
            }

            const usersResponse = await axios.get(`${API_URL}/users`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (usersResponse.data.success) {
                setDashboardStats(prev => ({
                    ...prev,
                    totalUsers: usersResponse.data.users.length
                }));
                console.log('Users data:', usersResponse.data);
                setUsers(usersResponse.data.users);
            }

            const conversationsResponse = await axios.get(`${API_URL}/chat/conversations`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (conversationsResponse.data.success) {
                const unreadCount = conversationsResponse.data.conversations.reduce(
                    (acc, conv) => acc + (conv.unreadCount || 0), 0
                );

                setDashboardStats(prev => ({
                    ...prev,
                    totalChats: conversationsResponse.data.conversations.length,
                    unreadMessages: unreadCount
                }));
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            showToast({
                title: "Lỗi",
                message: "Không thể tải dữ liệu bảng điều khiển",
                type: "error",
                duration: 3000
            });
        } finally {
            setLoadingDashboard(false);
        }
    };

    useEffect(() => {
        if (!user) {
            showToast({
                title: "Quyền truy cập bị từ chối",
                message: "Bạn cần đăng nhập để truy cập trang Admin",
                type: "error",
                duration: 3000
            });
            navigate('/login');
            return;
        }

        if (user.role !== 'admin') {
            showToast({
                title: "Quyền truy cập bị từ chối",
                message: "Bạn không có quyền truy cập trang Admin",
                type: "error",
                duration: 3000
            });
            navigate('/');
            return;
        }

        showToast({
            title: "Xin chào Admin",
            message: `Chào mừng ${user.name} đến với trang quản trị`,
            type: "success",
            duration: 3000
        });
    }, [user, navigate]);

    useEffect(() => {
        if (activeTab === 'invoices') {
            fetchInvoices();
        } else if (activeTab === 'products') {
            fetchProducts();
        } else if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'dashboard') {
            fetchDashboardData();
        } else if (activeTab === 'chat') {
            fetchConversations();
        }
    }, [activeTab, token]);
    
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    const fetchConversations = async () => {
        try {
            setChatLoading(true);
            const response = await axios.get(`${API_URL}/chat/conversations`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                setConversations(response.data.conversations);
                setFilteredConversations(response.data.conversations);
            } else {
                showToast({
                    title: "Lỗi",
                    message: "Không thể tải danh sách cuộc hội thoại",
                    type: "error",
                    duration: 3000
                });
            }
            setChatLoading(false);
        } catch (error) {
            console.error('Lỗi khi lấy cuộc hội thoại:', error);
            showToast({
                title: "Lỗi",
                message: "Không thể tải danh sách cuộc hội thoại",
                type: "error",
                duration: 3000
            });
            setChatLoading(false);
        }
    };
    
    const fetchMessages = async (conversationId) => {
        if (!conversationId) return;
        
        try {
            setChatLoading(true);
            const response = await axios.get(`${API_URL}/chat/messages/${conversationId}`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                setMessages(response.data.messages);
                
                markAsRead(conversationId);
            } else {
                showToast({
                    title: "Lỗi",
                    message: "Không thể tải tin nhắn",
                    type: "error",
                    duration: 3000
                });
            }
            setChatLoading(false);
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
            showToast({
                title: "Lỗi",
                message: "Không thể tải tin nhắn",
                type: "error",
                duration: 3000
            });
            setChatLoading(false);
        }
    };
    
    const markAsRead = async (conversationId) => {
        try {
            await axios.put(`${API_URL}/chat/conversation/${conversationId}/read`, {}, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            setConversations(prev => 
                prev.map(conv => 
                    conv._id === conversationId 
                        ? { ...conv, unreadCount: 0 } 
                        : conv
                )
            );
            
            setFilteredConversations(prev => 
                prev.map(conv => 
                    conv._id === conversationId 
                        ? { ...conv, unreadCount: 0 } 
                        : conv
                )
            );
        } catch (error) {
            console.error('Lỗi khi đánh dấu đã đọc:', error);
        }
    };
    
    const handleSendChatMessage = async (e) => {
        e.preventDefault();
        
        if (!newChatMessage.trim() || !selectedConversation) return;
        
        try {
            const messageData = {
                conversationId: selectedConversation._id,
                senderId: user._id,
                senderName: user.name || 'Admin',
                text: newChatMessage,
                isAdmin: true
            };
            
            const tempMessage = {
                ...messageData,
                _id: Date.now().toString(),
                createdAt: new Date()
            };
            
            setMessages(prev => [...prev, tempMessage]);
            setNewChatMessage('');
            
            setTimeout(scrollToBottom, 50);
            
            const response = await axios.post(`${API_URL}/chat/message`, messageData, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.data.success) {
                showToast({
                    title: "Lỗi",
                    message: "Không thể gửi tin nhắn",
                    type: "error",
                    duration: 3000
                });
            } else {
                updateConversationSilently(selectedConversation._id, newChatMessage);
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            showToast({
                title: "Lỗi",
                message: "Không thể gửi tin nhắn",
                type: "error",
                duration: 3000
            });
        }
    };
    
    const updateConversationSilently = async (conversationId, lastMessage) => {
        try {
            const response = await axios.get(`${API_URL}/chat/conversations`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                setConversations(response.data.conversations);
                
                const updatedFilteredConvs = response.data.conversations.filter(conv => 
                    filteredConversations.some(fc => fc._id === conv._id)
                );
                
                if (updatedFilteredConvs.length > 0) {
                    setFilteredConversations(updatedFilteredConvs);
                }
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật danh sách cuộc hội thoại:', error);
        }
    };
    
    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation._id);
        
        setTimeout(scrollToBottom, 300);
    };
    
    const handleConversationSearch = (e) => {
        const term = e.target.value;
        setConversationSearchTerm(term);
        
        if (!term.trim()) {
            setFilteredConversations(conversations);
            return;
        }
        
        const filtered = conversations.filter(conv => 
            (conv.userName && conv.userName.toLowerCase().includes(term.toLowerCase())) ||
            (conv.userEmail && conv.userEmail.toLowerCase().includes(term.toLowerCase()))
        );
        
        setFilteredConversations(filtered);
    };
    
    const hasUnreadMessages = () => {
        return conversations.some(conv => conv.unreadCount > 0);
    };
    
    const getTotalUnreadMessages = () => {
        return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
    };

    const fetchInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const response = await axios.get(`${API_URL}/orders/admin/orders`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setInvoices(response.data.orders);
                setFilteredInvoices(response.data.orders);
            } else {
                showToast({
                    title: "Lỗi",
                    message: "Không thể tải danh sách hóa đơn",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy hóa đơn:', error);
            showToast({
                title: "Lỗi",
                message: "Không thể tải danh sách hóa đơn",
                type: "error",
                duration: 3000
            });
        } finally {
            setLoadingInvoices(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const response = await axios.get(`${API_URL}/products/products`, {
                withCredentials: true
            });

            if (response.data.success) {
                setProducts(response.data.products);
                setFilteredProducts(response.data.products);
            } else {
                showToast({
                    title: "Lỗi",
                    message: "Không thể tải danh sách sản phẩm",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy sản phẩm:', error);
            showToast({
                title: "Lỗi",
                message: "Không thể tải danh sách sản phẩm",
                type: "error",
                duration: 3000
            });
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await axios.get(`${API_URL}/users`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setUsers(response.data.users);
                setFilteredUsers(response.data.users);
            } else {
                showToast({
                    title: "Lỗi",
                    message: "Không thể tải danh sách người dùng",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy người dùng:', error);
            showToast({
                title: "Lỗi",
                message: "Không thể tải danh sách người dùng",
                type: "error",
                duration: 3000
            });
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'products') {
            filterProducts();
        }
    }, [products, searchTerm, brandFilter, priceSort, genderFilter, activeTab]);

    const filterProducts = () => {
        let filtered = [...products];
        
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(product => 
                (product.name && product.name.toLowerCase().includes(term)) ||
                (product.description && product.description.toLowerCase().includes(term)) ||
                (product.brand && product.brand.toLowerCase().includes(term))
            );
        }
        
        if (brandFilter) {
            filtered = filtered.filter(product => 
                product.brand && product.brand.toLowerCase() === brandFilter.toLowerCase()
            );
        }
        
        if (genderFilter) {
            filtered = filtered.filter(product => 
                product.gioiTinh && product.gioiTinh.toLowerCase() === genderFilter.toLowerCase()
            );
        }
        
        if (priceSort === 'asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (priceSort === 'desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (priceSort === 'name-asc') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (priceSort === 'name-desc') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        }
        
        setFilteredProducts(filtered);
    };

    const handleAddProduct = () => {
        setShowAddForm(true);
    };

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsUploadingImages(true);
        showToast({
            title: "Đang tải ảnh",
            message: "Đang tải ảnh lên Cloudflare R2...",
            type: "info",
            duration: 3000
        });

        try {
            const data = await uploadProductImages(files, token);
            if (data.success && data.images) {
                if (showEditForm) {
                    setEditingProduct({ ...editingProduct, images: data.images });
                } else {
                    setNewProduct({ ...newProduct, images: data.images });
                }
                showToast({
                    title: "Thành công",
                    message: "Tải ảnh lên Cloudflare R2 thành công!",
                    type: "success",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải ảnh:', error);
            showToast({
                title: "Lỗi",
                message: error.message || "Không thể tải ảnh lên Cloudflare R2. Vui lòng kiểm tra cấu hình!",
                type: "error",
                duration: 4000
            });
        } finally {
            setIsUploadingImages(false);
        }
    };

    const handleSaveProduct = () => {
        const randomCode = !newProduct.code || newProduct.code.trim() === '' ? 
            `PROD-${Math.floor(Math.random() * 1000000)}` : newProduct.code;
            
        const productData = {
            name: newProduct.name,
            price: newProduct.price,
            description: newProduct.description || `Mô tả sản phẩm ${newProduct.name}`,
            images: newProduct.images || [{ url: 'https://via.placeholder.com/150' }],
            category: newProduct.category || 'Áo sơ mi',
            stock: newProduct.stock || 10,
            code: randomCode,
            brand: newProduct.brand,
            xuatXu: newProduct.xuatXu,
            gioiTinh: newProduct.gioiTinh,
            mauSac: newProduct.mauSac,
            kieuDang: newProduct.kieuDang,
            chatLieu: newProduct.chatLieu,
            size: newProduct.size
        };

        console.log('Gửi dữ liệu sản phẩm:', productData);

        axios.post(`${API_URL}/products/product/new`, productData, { 
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.data.success) {
                setProducts([...products, response.data.product]);
                setShowAddForm(false);
                setNewProduct({
                    code: '',
                    name: '',
                    images: [],
                    price: 0,
                    description: '',
                    stock: 10,
                    category: '',
                    brand: '',
                    xuatXu: '',
                    gioiTinh: '',
                    mauSac: '',
                    kieuDang: '',
                    chatLieu: '',
                    size: ''
                });
                showToast({
                    title: "Thành công",
                    message: "Thêm sản phẩm mới thành công!",
                    type: "success",
                    duration: 3000
                });
            }
        })
        .catch(error => {
            console.error('Lỗi khi thêm sản phẩm:', error);
            if (error.response) {
                console.error('Dữ liệu phản hồi:', error.response.data);
            }
            showToast({
                title: "Lỗi",
                message: "Không thể thêm sản phẩm. Vui lòng thử lại!",
                type: "error",
                duration: 3000
            });
        });
    };

    const handleEditProduct = async (productId) => {
        try {
            const response = await axios.get(`${API_URL}/products/product/${productId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                const product = response.data.product;
                setEditingProduct({
                    _id: product._id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    brand: product.brand,
                    category: product.category,
                    gioiTinh: product.gioiTinh,
                    mauSac: product.mauSac,
                    kieuDang: product.kieuDang,
                    chatLieu: product.chatLieu,
                    xuatXu: product.xuatXu,
                    size: product.size,
                    images: product.images || []
                });
                setShowEditForm(true);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin sản phẩm:', error);
            showToast({
                title: "Lỗi",
                message: "Không thể lấy thông tin sản phẩm. Vui lòng thử lại!",
                type: "error",
                duration: 3000
            });
        }
    };

    const handleDeleteProduct = (productId) => {
        axios.delete(`${API_URL}/products/product/${productId}`, { withCredentials: true })
            .then(response => {
                if (response.data.success) {
                    setProducts(products.filter(product => product._id !== productId));
                    showToast({
                        title: "Thành công",
                        message: "Đã xóa sản phẩm thành công!",
                        type: "success",
                        duration: 3000
                    });
                }
            })
            .catch(error => {
                console.error('Lỗi khi xóa sản phẩm:', error);
                showToast({
                    title: "Lỗi",
                    message: "Không thể xóa sản phẩm. Vui lòng thử lại!",
                    type: "error",
                    duration: 3000
                });
            });
    };

    const handleCleanBase64Images = async () => {
        if (!window.confirm("Hệ thống sẽ chuyển toàn bộ ảnh Base64 hiện tại của sản phẩm tải trực tiếp lên Cloudflare R2 và lưu link ảnh R2 vào database.\n\nTất cả ảnh thật của sản phẩm sẽ được giữ nguyên 100% (không bị mất ảnh)!\n\nBạn có muốn bắt đầu chuyển đổi không?")) {
            return;
        }

        showToast({
            title: "Đang chuyển đổi",
            message: "Đang tải ảnh từ database lên Cloudflare R2...",
            type: "info",
            duration: 4000
        });

        try {
            const response = await axios.post(`${API_URL}/products/admin/clean-base64`, {}, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                showToast({
                    title: "Thành công",
                    message: response.data.message,
                    type: "success",
                    duration: 4000
                });
                const res = await axios.get(`${API_URL}/products/products`, { withCredentials: true });
                if (res.data.success) {
                    setProducts(res.data.products);
                }
            }
        } catch (error) {
            console.error('Lỗi khi dọn dẹp database:', error);
            showToast({
                title: "Lỗi",
                message: error.response?.data?.message || "Không thể dọn dẹp database. Vui lòng thử lại!",
                type: "error",
                duration: 3000
            });
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleBrandFilter = (e) => {
        setBrandFilter(e.target.value);
        setCurrentPage(1);
    };

    const handlePriceSort = (e) => {
        setPriceSort(e.target.value);
    };
    
    const handleGenderFilter = (e) => {
        setGenderFilter(e.target.value);
        setCurrentPage(1);
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => prev + 1);
    };
    
    const getProductsForCurrentPage = () => {
        const pageSize = 8;
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        return filteredProducts.slice(startIdx, endIdx);
    };
    
    const getTotalPages = () => {
        const pageSize = 8;
        return Math.ceil(filteredProducts.length / pageSize);
    };
    
    const renderNoProductsMessage = () => {
        if (searchTerm || brandFilter || genderFilter) {
            return (
                <div className={cx('empty-state')}>
                    <i className={cx('empty-state-icon', 'fas fa-search')}></i>
                    <p>Không tìm thấy sản phẩm phù hợp với bộ lọc</p>
                    <button
                        onClick={clearFilters}
                        className={cx('empty-state-btn')}
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            );
        }

        return (
            <div className={cx('empty-state')}>
                <i className={cx('empty-state-icon', 'fas fa-box-open')}></i>
                <p>Chưa có sản phẩm nào</p>
                <button
                    onClick={handleAddProduct}
                    className={cx('empty-state-btn')}
                >
                    Thêm sản phẩm mới
                </button>
            </div>
        );
    };
    
    const clearFilters = () => {
        setSearchTerm('');
        setBrandFilter('');
        setPriceSort('');
        setGenderFilter('');
        setCurrentPage(1);
    };

    useEffect(() => {
        if (invoices.length === 0) return;
        
        let result = [...invoices];
        
        if (invoiceSearchTerm.trim()) {
            const term = invoiceSearchTerm.toLowerCase();
            result = result.filter(invoice => 
                (invoice._id && invoice._id.toLowerCase().includes(term)) ||
                (invoice.user && invoice.user.name && invoice.user.name.toLowerCase().includes(term)) ||
                (invoice.user && invoice.user.email && invoice.user.email.toLowerCase().includes(term))
            );
        }
        
        if (invoiceStatusFilter) {
            result = result.filter(invoice => 
                invoice.orderStatus && invoice.orderStatus.toLowerCase() === invoiceStatusFilter.toLowerCase()
            );
        }
        
        if (invoiceSort === 'date-desc') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (invoiceSort === 'date-asc') {
            result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (invoiceSort === 'price-desc') {
            result.sort((a, b) => b.totalPrice - a.totalPrice);
        } else if (invoiceSort === 'price-asc') {
            result.sort((a, b) => a.totalPrice - b.totalPrice);
        }
        
        setFilteredInvoices(result);
    }, [invoices, invoiceSearchTerm, invoiceStatusFilter, invoiceSort]);
    
    useEffect(() => {
        if (users.length === 0) return;
        
        let result = [...users];
        
        if (userSearchTerm.trim()) {
            const term = userSearchTerm.toLowerCase();
            result = result.filter(user => 
                (user.name && user.name.toLowerCase().includes(term)) ||
                (user.email && user.email.toLowerCase().includes(term)) ||
                (user.phone && user.phone.includes(term))
            );
        }
        
        setFilteredUsers(result);
    }, [users, userSearchTerm]);
    
    const handleCancelOrder = async (orderId) => {
        try {
            const response = await axios.put(
                `${API_URL}/orders/order/${orderId}/cancel`,
                { 
                    status: 'Cancelled',
                    cancelledBy: 'admin',
                    cancelledByUserName: user.name,
                    cancelledAt: new Date().toISOString()
                },
                {
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                const updatedInvoices = invoices.map(invoice => {
                    if (invoice._id === orderId) {
                        return { ...invoice, orderStatus: 'Cancelled' };
                    }
                    return invoice;
                });
                
                setInvoices(updatedInvoices);
                
                const updatedRecentOrders = dashboardStats.recentOrders.map(order => {
                    if (order._id === orderId) {
                        return { ...order, orderStatus: 'Cancelled' };
                    }
                    return order;
                });
                
                setDashboardStats({
                    ...dashboardStats,
                    recentOrders: updatedRecentOrders
                });
                
                if (selectedInvoice && selectedInvoice._id === orderId) {
                    setSelectedInvoice({ ...selectedInvoice, orderStatus: 'Cancelled' });
                }
                
                showToast({
                    title: "Thành công",
                    message: "Đã hủy đơn hàng thành công",
                    type: "success",
                    duration: 3000
                });
            } else {
                showToast({
                    title: "Lỗi",
                    message: response.data.message || "Không thể hủy đơn hàng",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi hủy đơn hàng:', error);
            showToast({
                title: "Lỗi",
                message: error.response?.data?.message || "Không thể hủy đơn hàng. Vui lòng thử lại sau.",
                type: "error",
                duration: 3000
            });
        }
    };
    
    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceModal(true);
    };
    
    const handleAddUser = () => {
        setSelectedUser(null);
        setNewUser({
            name: '',
            email: '',
            password: '',
            role: 'user',
            phone: '',
            phoneNumber: '',
            address: ''
        });
        setIsEditingUser(false);
        setShowUserModal(true);
    };

    const handleEditUser = (userData) => {
        setSelectedUser(userData);
        setNewUser({
            _id: userData._id,
            name: userData.name || '',
            email: userData.email || '',
            password: '',
            role: userData.role || 'user',
            phone: userData.phoneNumber || userData.phone || '',
            phoneNumber: userData.phoneNumber || userData.phone || '',
            address: Array.isArray(userData.address) && userData.address.length > 0
                ? [userData.address[0]?.street, userData.address[0]?.city].filter(Boolean).join(', ')
                : (typeof userData.address === 'string' ? userData.address : '')
        });
        setIsEditingUser(true);
        setShowUserModal(true);
    };

    const handleDeleteUser = async (userId) => {
        if (user && (String(user._id || user.id) === String(userId))) {
            showToast({
                title: "Thao tác bị chặn",
                message: "Bạn không thể xóa tài khoản của chính mình!",
                type: "warning",
                duration: 3000
            });
            return;
        }

        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa người dùng này không?");
        if (!confirmDelete) return;

        try {
            const response = await axios.delete(`${API_URL}/users/${userId}`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const updatedUsers = users.filter(u => u._id !== userId);
                setUsers(updatedUsers);
                setFilteredUsers(prev => prev.filter(u => u._id !== userId));

                showToast({
                    title: "Thành công",
                    message: "Đã xóa người dùng thành công",
                    type: "success",
                    duration: 3000
                });
            } else {
                showToast({
                    title: "Lỗi",
                    message: response.data.message || "Không thể xóa người dùng",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi xóa người dùng:', error);
            showToast({
                title: "Lỗi",
                message: error.response?.data?.message || "Không thể xóa người dùng",
                type: "error",
                duration: 3000
            });
        }
    };

    const handleSaveUser = async () => {
        try {
            let response;

            if (!newUser.name?.trim() || !newUser.email?.trim()) {
                showToast({
                    title: "Lỗi",
                    message: "Vui lòng nhập tên và email",
                    type: "error",
                    duration: 3000
                });
                return;
            }

            if (isEditingUser) {
                const userData = {
                    name: newUser.name.trim(),
                    email: newUser.email.trim(),
                    role: newUser.role || 'user',
                    phone: newUser.phone?.trim() || '',
                    phoneNumber: newUser.phone?.trim() || '',
                    address: newUser.address ? [{ street: newUser.address.trim(), city: '', country: 'Việt Nam' }] : []
                };

                if (newUser.password && newUser.password.trim() !== '') {
                    if (newUser.password.length < 6) {
                        showToast({
                            title: "Mật khẩu yếu",
                            message: "Mật khẩu mới phải có ít nhất 6 ký tự",
                            type: "warning",
                            duration: 3000
                        });
                        return;
                    }
                    userData.password = newUser.password.trim();
                }

                response = await axios.put(
                    `${API_URL}/users/${newUser._id}`,
                    userData,
                    {
                        withCredentials: true,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            } else {
                if (!newUser.password || newUser.password.trim() === '') {
                    showToast({
                        title: "Lỗi",
                        message: "Vui lòng nhập mật khẩu",
                        type: "error",
                        duration: 3000
                    });
                    return;
                }

                if (newUser.password.length < 6) {
                    showToast({
                        title: "Mật khẩu yếu",
                        message: "Mật khẩu phải có ít nhất 6 ký tự",
                        type: "warning",
                        duration: 3000
                    });
                    return;
                }

                const createData = {
                    name: newUser.name.trim(),
                    email: newUser.email.trim(),
                    password: newUser.password.trim(),
                    role: newUser.role || 'user',
                    phone: newUser.phone?.trim() || '',
                    phoneNumber: newUser.phone?.trim() || '',
                    address: newUser.address ? [{ street: newUser.address.trim(), city: '', country: 'Việt Nam' }] : []
                };

                response = await axios.post(
                    `${API_URL}/users`,
                    createData,
                    {
                        withCredentials: true,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            }

            if (response.data.success) {
                fetchUsers();

                setShowUserModal(false);
                setSelectedUser(null);

                showToast({
                    title: "Thành công",
                    message: isEditingUser ? "Đã cập nhật người dùng" : "Đã thêm người dùng mới",
                    type: "success",
                    duration: 3000
                });
            } else {
                showToast({
                    title: "Lỗi",
                    message: response.data.message || "Không thể lưu thông tin người dùng",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi lưu thông tin người dùng:', error);
            showToast({
                title: "Lỗi",
                message: error.response?.data?.message || "Không thể lưu thông tin người dùng",
                type: "error",
                duration: 3000
            });
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getStatusVietnamese = (status) => {
        switch (status) {
            case 'Processing': return 'Đang xử lý';
            case 'Shipped': return 'Đang giao';
            case 'Delivered': return 'Đã giao';
            case 'Cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    const handleRemoveOrder = async (orderId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa hoàn toàn đơn hàng này? Hành động này không thể hoàn tác.')) {
            return;
        }
        
        try {
            const response = await axios.delete(
                `${API_URL}/orders/admin/order/${orderId}/remove`,
                {
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                const updatedInvoices = invoices.filter(invoice => invoice._id !== orderId);
                setInvoices(updatedInvoices);
                
                const updatedRecentOrders = dashboardStats.recentOrders.filter(order => order._id !== orderId);
                
                setDashboardStats({
                    ...dashboardStats,
                    recentOrders: updatedRecentOrders
                });
                
                if (selectedInvoice && selectedInvoice._id === orderId) {
                    setSelectedInvoice(null);
                    setShowInvoiceModal(false);
                }
                
                showToast({
                    title: "Thành công",
                    message: "Đã xóa đơn hàng thành công",
                    type: "success",
                    duration: 3000
                });
            } else {
                showToast({
                    title: "Lỗi",
                    message: response.data.message || "Không thể xóa đơn hàng",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi xóa đơn hàng:', error);
            showToast({
                title: "Lỗi",
                message: error.response?.data?.message || "Không thể xóa đơn hàng. Vui lòng thử lại sau.",
                type: "error",
                duration: 3000
            });
        }
    };

    const handleUpdateProduct = async () => {
        if (!editingProduct.name || !editingProduct.price) {
            showToast({
                title: "Lỗi",
                message: "Vui lòng nhập tên và giá sản phẩm",
                type: "error",
                duration: 3000
            });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', editingProduct.name);
            formData.append('price', editingProduct.price);
            formData.append('description', editingProduct.description || '');
            formData.append('stock', editingProduct.stock || 10);
            formData.append('brand', editingProduct.brand || '');
            formData.append('category', editingProduct.category || '');
            formData.append('gioiTinh', editingProduct.gioiTinh || '');
            formData.append('mauSac', editingProduct.mauSac || '');
            formData.append('kieuDang', editingProduct.kieuDang || '');
            formData.append('chatLieu', editingProduct.chatLieu || '');
            formData.append('xuatXu', editingProduct.xuatXu || '');
            formData.append('size', editingProduct.size || '');

            if (productImages.length > 0) {
                productImages.forEach(file => {
                    formData.append('images', file);
                });
            }

            const response = await axios.put(
                `${API_URL}/products/product/${editingProduct._id}`,
                editingProduct,
                {
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                const updatedProducts = products.map(product => {
                    if (product._id === editingProduct._id) {
                        return response.data.product;
                    }
                    return product;
                });
                
                setProducts(updatedProducts);
                setShowEditForm(false);
                setEditingProduct(null);
                setProductImages([]);
                
                showToast({
                    title: "Thành công",
                    message: "Cập nhật sản phẩm thành công!",
                    type: "success",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error);
            showToast({
                title: "Lỗi",
                message: error.response?.data?.message || "Không thể cập nhật sản phẩm. Vui lòng thử lại!",
                type: "error",
                duration: 3000
            });
        }
    };

    const TableLoadingRow = ({ colSpan = 7, message = "Đang tải dữ liệu..." }) => (
        <tr>
            <td colSpan={colSpan} className={cx('table-loading-cell')}>
                <div className={cx('table-loading-content')}>
                    <div className={cx('table-loading-spinner')}></div>
                    <span className={cx('table-loading-text')}>{message}</span>
                </div>
            </td>
        </tr>
    );

    const MobileLoadingBox = ({ message = "Đang tải dữ liệu..." }) => (
        <div className={cx('mobile-loading-container')}>
            <div className={cx('table-loading-spinner')}></div>
            <span className={cx('table-loading-text')}>{message}</span>
        </div>
    );

    const StatBox = ({ icon, number, label, color }) => {
        const colorClasses = {
            blue: cx('stat-icon-blue'),
            green: cx('stat-icon-green'),
            orange: cx('stat-icon-orange'),
            purple: cx('stat-icon-purple')
        };
        
        return (
            <div className={cx('stat-box')}>
                <div className={cx('stat-icon', colorClasses[color] || '')}>
                    <i className={icon}></i>
                </div>
                <div className={cx('stat-info')}>
                    <div className={cx('stat-number')}>{number}</div>
                    <div className={cx('stat-label')}>{label}</div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className={cx('dashboard-content')}>
                        <div className={cx('dashboard-header')}>
                        </div>
                        <div className={cx('stats-container-wrapper')}>
                            <div className={cx('stats-container')}>
                                <StatBox 
                                    icon="fas fa-shopping-bag" 
                                    number={dashboardStats.totalOrders} 
                                    label="Tổng đơn hàng"
                                    color="blue"
                                />
                                <StatBox 
                                    icon="fas fa-users" 
                                    number={dashboardStats.totalUsers} 
                                    label="Người dùng"
                                    color="green"
                                />
                                <StatBox 
                                    icon="fas fa-box" 
                                    number={dashboardStats.totalProducts} 
                                    label="Sản phẩm"
                                    color="orange"
                                />
                                <StatBox 
                                    icon="fas fa-dollar-sign" 
                                    number={formatCurrency(dashboardStats.recentOrders.reduce((total, order) => total + order.totalPrice, 0))} 
                                    label="Doanh thu"
                                    color="purple"
                                />
                            </div>
                        </div>

                        <div className={cx('recent-orders')}>
                            <h3>Đơn hàng gần đây</h3>
                            {/* Hiển thị bảng trên màn hình lớn */}
                            <div className={cx('table-responsive', 'd-none-mobile')}>
                                <table className={cx('orders-table')}>
                                    <thead>
                                        <tr>
                                            <th>Mã đơn</th>
                                            <th>Khách hàng</th>
                                            <th>Thời gian</th>
                                            <th>Tổng tiền</th>
                                            <th>Phương thức TT</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingDashboard ? (
                                            <TableLoadingRow colSpan={7} message="Đang tải đơn hàng gần đây..." />
                                        ) : dashboardStats.recentOrders.length > 0 ? (
                                            dashboardStats.recentOrders.map((order) => (
                                                <tr key={order._id}>
                                                    <td>#{order._id.slice(-6)}</td>
                                                    <td>{order.shippingInfo?.fullName || 'Không có tên'}</td>
                                                    <td>{formatDate(order.createdAt)}</td>
                                                    <td>{formatCurrency(order.totalPrice)}</td>
                                                    <td>{order.paymentMethod === "Banking" ? "Chuyển khoản" : "Tiền mặt (COD)"}</td>
                                                    <td>
                                                        <span
                                                            className={cx('status', {
                                                                'pending': order.orderStatus === 'Pending',
                                                                'processing': order.orderStatus === 'Processing',
                                                                'shipped': order.orderStatus === 'Shipped',
                                                                'delivered': order.orderStatus === 'Delivered',
                                                                'cancelled': order.orderStatus === 'Cancelled'
                                                            })}
                                                        >
                                                            {getStatusVietnamese(order.orderStatus)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className={cx('action-buttons')}>
                                                            <button
                                                                className={cx('view-btn')}
                                                                onClick={() => handleViewInvoice(order)}
                                                                title="Xem chi tiết"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                                                                <button
                                                                    className={cx('cancel-btn')}
                                                                    onClick={() => handleCancelOrder(order._id)}
                                                                    title="Hủy đơn hàng"
                                                                >
                                                                    <i className="fas fa-times"></i>
                                                                </button>
                                                            )}
                                                            <button
                                                                className={cx('delete-btn')}
                                                                onClick={() => handleRemoveOrder(order._id)}
                                                                title="Xóa đơn hàng"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className={cx('no-data')}>Chưa có đơn hàng nào</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Hiển thị danh sách dạng card trên mobile */}
                            <div className={cx('recent-orders-mobile', 'd-block-mobile')}>
                                {loadingDashboard ? (
                                    <MobileLoadingBox message="Đang tải đơn hàng gần đây..." />
                                ) : dashboardStats.recentOrders.length > 0 ? (
                                    dashboardStats.recentOrders.map((order) => (
                                        <div key={order._id} className={cx('mobile-order-item')}>
                                            <div className={cx('mobile-order-header')}>
                                                <div className={cx('order-id')}>#{order._id.slice(-6)}</div>
                                                <div className={cx('order-date')}>{formatDate(order.createdAt)}</div>
                                            </div>
                                            <div className={cx('mobile-order-details')}>
                                                <div className={cx('detail-row')}>
                                                    <div className={cx('detail-label')}>Khách hàng:</div>
                                                    <div className={cx('detail-value')}>{order.shippingInfo?.fullName || 'Không có tên'}</div>
                                                </div>
                                                <div className={cx('detail-row')}>
                                                    <div className={cx('detail-label')}>Tổng tiền:</div>
                                                    <div className={cx('detail-value')}>{formatCurrency(order.totalPrice)}</div>
                                                </div>
                                                <div className={cx('detail-row')}>
                                                    <div className={cx('detail-label')}>Phương thức:</div>
                                                    <div className={cx('detail-value')}>{order.paymentMethod === "Banking" ? "Chuyển khoản" : "Tiền mặt (COD)"}</div>
                                                </div>
                                            </div>
                                            <div className={cx('mobile-order-status')}>
                                                <span
                                                    className={cx('status', {
                                                        'pending': order.orderStatus === 'Pending',
                                                        'processing': order.orderStatus === 'Processing',
                                                        'shipped': order.orderStatus === 'Shipped',
                                                        'delivered': order.orderStatus === 'Delivered',
                                                        'cancelled': order.orderStatus === 'Cancelled'
                                                    })}
                                                >
                                                    {getStatusVietnamese(order.orderStatus)}
                                                </span>
                                            </div>
                                            <div className={cx('mobile-order-actions')}>
                                                <button
                                                    className={cx('view-btn')}
                                                    onClick={() => handleViewInvoice(order)}
                                                >
                                                    <i className="fas fa-eye"></i> Xem
                                                </button>
                                                {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                                                    <button
                                                        className={cx('cancel-btn')}
                                                        onClick={() => handleCancelOrder(order._id)}
                                                    >
                                                        <i className="fas fa-times"></i> Hủy
                                                    </button>
                                                )}
                                                <button
                                                    className={cx('delete-btn')}
                                                    onClick={() => handleRemoveOrder(order._id)}
                                                >
                                                    <i className="fas fa-trash"></i> Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={cx('no-data')}>Chưa có đơn hàng nào</div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'invoices':
                return (
                    <div className={cx('invoice-management')}>
                        <h2>Quản lý đơn hàng</h2>
                        
                        <div className={cx('invoice-filters')}>
                            <div className={cx('invoice-search')}>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã đơn hàng hoặc tên khách hàng..."
                                    value={invoiceSearchTerm}
                                    onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                                />
                                <button><i className="fas fa-search"></i></button>
                            </div>
                            
                            <div className={cx('filter-group')}>
                                <select 
                                    value={invoiceStatusFilter} 
                                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">Tất cả trạng thái</option>
                                    <option value="PENDING">Chờ xác nhận</option>
                                    <option value="PROCESSING">Đang xử lý</option>
                                    <option value="SHIPPED">Đang giao</option>
                                    <option value="DELIVERED">Đã giao</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Hiển thị bảng trên màn hình lớn */}
                        <div className={cx('invoice-table-container', 'd-none-mobile')}>
                            <table className={cx('invoice-table')}>
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Khách hàng</th>
                                        <th>Thời gian</th>
                                        <th>Tổng tiền</th>
                                        <th>Phương thức TT</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingInvoices ? (
                                        <TableLoadingRow colSpan={7} message="Đang tải danh sách đơn hàng..." />
                                    ) : filteredInvoices.length > 0 ? (
                                        filteredInvoices.map((invoice) => (
                                            <tr key={invoice._id}>
                                                <td>#{invoice._id.slice(-6)}</td>
                                                <td>{invoice.shippingInfo?.fullName || 'Không có tên'}</td>
                                                <td>{formatDate(invoice.createdAt)}</td>
                                                <td>{formatCurrency(invoice.totalPrice)}</td>
                                                <td>{invoice.paymentMethod === "Banking" ? "Chuyển khoản" : "Tiền mặt (COD)"}</td>
                                                <td>
                                                    <span
                                                        className={cx('status', {
                                                            'pending': invoice.orderStatus === 'Pending',
                                                            'processing': invoice.orderStatus === 'Processing',
                                                            'shipped': invoice.orderStatus === 'Shipped',
                                                            'delivered': invoice.orderStatus === 'Delivered',
                                                            'cancelled': invoice.orderStatus === 'Cancelled'
                                                        })}
                                                    >
                                                        {getStatusVietnamese(invoice.orderStatus)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={cx('action-buttons')}>
                                                        <button
                                                            className={cx('view-btn')}
                                                            onClick={() => handleViewInvoice(invoice)}
                                                            title="Xem chi tiết"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        {invoice.orderStatus !== 'Delivered' && invoice.orderStatus !== 'Cancelled' && (
                                                            <button
                                                                className={cx('cancel-btn')}
                                                                onClick={() => handleCancelOrder(invoice._id)}
                                                                title="Hủy đơn hàng"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        )}
                                                        <button
                                                            className={cx('delete-btn')}
                                                            onClick={() => handleRemoveOrder(invoice._id)}
                                                            title="Xóa đơn hàng"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className={cx('no-data')}>Không tìm thấy đơn hàng nào</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Hiển thị giao diện mobile */}
                        <div className={cx('invoice-mobile-list', 'd-block-mobile')}>
                            {loadingInvoices ? (
                                <MobileLoadingBox message="Đang tải danh sách đơn hàng..." />
                            ) : filteredInvoices.length > 0 ? (
                                filteredInvoices.map((invoice) => (
                                    <div key={invoice._id} className={cx('invoice-mobile-item')}>
                                        <div className={cx('invoice-mobile-header')}>
                                            <div className={cx('invoice-id')}>#{invoice._id.slice(-6)}</div>
                                            <div className={cx('invoice-date')}>{formatDate(invoice.createdAt)}</div>
                                        </div>
                                        <div className={cx('invoice-mobile-details')}>
                                            <div className={cx('detail-row')}>
                                                <div className={cx('detail-label')}>Khách hàng:</div>
                                                <div className={cx('detail-value')}>{invoice.shippingInfo?.fullName || 'Không có tên'}</div>
                                            </div>
                                            <div className={cx('detail-row')}>
                                                <div className={cx('detail-label')}>Tổng tiền:</div>
                                                <div className={cx('detail-value')}>{formatCurrency(invoice.totalPrice)}</div>
                                            </div>
                                            <div className={cx('detail-row')}>
                                                <div className={cx('detail-label')}>Phương thức:</div>
                                                <div className={cx('detail-value')}>{invoice.paymentMethod === "Banking" ? "Chuyển khoản" : "Tiền mặt (COD)"}</div>
                                            </div>
                                        </div>
                                        <div className={cx('invoice-mobile-status')}>
                                            <span
                                                className={cx('status', {
                                                    'pending': invoice.orderStatus === 'Pending',
                                                    'processing': invoice.orderStatus === 'Processing',
                                                    'shipped': invoice.orderStatus === 'Shipped',
                                                    'delivered': invoice.orderStatus === 'Delivered',
                                                    'cancelled': invoice.orderStatus === 'Cancelled'
                                                })}
                                            >
                                                {getStatusVietnamese(invoice.orderStatus)}
                                            </span>
                                        </div>
                                        <div className={cx('invoice-mobile-actions')}>
                                            <button 
                                                className={cx('view-btn')}
                                                onClick={() => handleViewInvoice(invoice)}
                                            >
                                                <i className="fas fa-eye"></i> Xem
                                            </button>
                                            {invoice.orderStatus !== 'Delivered' && invoice.orderStatus !== 'Cancelled' && (
                                                <button 
                                                    className={cx('cancel-btn')}
                                                    onClick={() => handleCancelOrder(invoice._id)}
                                                >
                                                    <i className="fas fa-times"></i> Hủy
                                                </button>
                                            )}
                                            <button 
                                                className={cx('delete-btn')}
                                                onClick={() => handleRemoveOrder(invoice._id)}
                                            >
                                                <i className="fas fa-trash"></i> Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={cx('no-data')}>Không tìm thấy đơn hàng nào</div>
                            )}
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className={cx('users-management')}>
                        <h2>Quản lý người dùng</h2>
                        
                        <div className={cx('users-actions')}>
                            <div className={cx('user-search')}>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                />
                                <button><i className="fas fa-search"></i></button>
                            </div>
                            
                            <button 
                                className={cx('add-user-btn')}
                                onClick={handleAddUser}
                            >
                                <i className="fas fa-plus"></i>
                                Thêm người dùng mới
                            </button>
                        </div>
                        
                        {/* Hiển thị bảng trên màn hình lớn */}
                        <div className={cx('users-table-container', 'd-none-mobile')}>
                            <table className={cx('users-table')}>
                                <thead>
                                    <tr>
                                        <th>Họ tên</th>
                                        <th>Email</th>
                                        <th>Số điện thoại</th>
                                        <th>Vai trò</th>
                                        <th>Ngày tạo</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingUsers ? (
                                        <TableLoadingRow colSpan={6} message="Đang tải danh sách người dùng..." />
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user._id}>
                                                <td>{user.name}</td>
                                                <td>{user.email}</td>
                                                <td>{user.phone || 'Chưa cập nhật'}</td>
                                                <td>
                                                    <span className={cx('role', {
                                                        'admin': user.role === 'admin',
                                                        'user': user.role === 'user'
                                                    })}>
                                                        {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(user.createdAt)}</td>
                                                <td>
                                                    <div className={cx('action-buttons')}>
                                                        <button
                                                            className={cx('view-btn')}
                                                            onClick={() => navigate(`/admin/users/${user._id}`)}
                                                            title="Xem chi tiết người dùng"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        <button
                                                            className={cx('edit-btn')}
                                                            onClick={() => handleEditUser(user)}
                                                            title="Chỉnh sửa nhanh"
                                                        >
                                                            <i className="fas fa-pencil-alt"></i>
                                                        </button>
                                                        <button
                                                            className={cx('delete-btn')}
                                                            onClick={() => handleDeleteUser(user._id)}
                                                            title="Xóa người dùng"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className={cx('no-data')}>Không tìm thấy người dùng nào</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Hiển thị giao diện mobile */}
                        <div className={cx('user-mobile-list', 'd-block-mobile')}>
                            {loadingUsers ? (
                                <MobileLoadingBox message="Đang tải danh sách người dùng..." />
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <div key={user._id} className={cx('user-mobile-item')}>
                                        <div className={cx('user-mobile-header')}>
                                            <div className={cx('user-name')}>{user.name}</div>
                                            <span className={cx('user-role', {
                                                'admin': user.role === 'admin',
                                                'user': user.role === 'user'
                                            })}>
                                                {user.role === 'admin' ? 'Admin' : 'User'}
                                            </span>
                                        </div>
                                        <div className={cx('user-mobile-details')}>
                                            <div className={cx('detail-row')}>
                                                <div className={cx('detail-label')}>Email:</div>
                                                <div className={cx('detail-value')}>{user.email}</div>
                                            </div>
                                            <div className={cx('detail-row')}>
                                                <div className={cx('detail-label')}>SĐT:</div>
                                                <div className={cx('detail-value')}>{user.phone || 'Chưa cập nhật'}</div>
                                            </div>
                                            <div className={cx('detail-row')}>
                                                <div className={cx('detail-label')}>Ngày tạo:</div>
                                                <div className={cx('detail-value')}>{formatDate(user.createdAt)}</div>
                                            </div>
                                        </div>
                                        <div className={cx('user-mobile-actions')}>
                                            <button
                                                className={cx('view-btn')}
                                                onClick={() => navigate(`/admin/users/${user._id}`)}
                                            >
                                                <FontAwesomeIcon icon={faEye} /> Chi tiết
                                            </button>
                                            <button
                                                className={cx('edit-btn')}
                                                onClick={() => handleEditUser(user)}
                                            >
                                                <i className="fas fa-pencil-alt"></i> Sửa
                                            </button>
                                            <button
                                                className={cx('delete-btn')}
                                                onClick={() => handleDeleteUser(user._id)}
                                            >
                                                <i className="fas fa-trash"></i> Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={cx('no-data')}>Không tìm thấy người dùng nào</div>
                            )}
                        </div>
                    </div>
                );
            case 'products':
                return (
                    <div className={cx('wrapper')}>
                        <div className={cx('product-management')}>
                            {showAddForm ? (
                                <div className={cx('add-product-form')}>
                                    <h3>Thêm sản phẩm mới</h3>
                                    <input
                                        type="text"
                                        placeholder="Tên sản phẩm"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Giá"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Thương hiệu"
                                        value={newProduct.brand}
                                        onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Xuất xứ"
                                        value={newProduct.xuatXu}
                                        onChange={(e) => setNewProduct({ ...newProduct, xuatXu: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Giới tính"
                                        value={newProduct.gioiTinh}
                                        onChange={(e) => setNewProduct({ ...newProduct, gioiTinh: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Màu sắc"
                                        value={newProduct.mauSac}
                                        onChange={(e) => setNewProduct({ ...newProduct, mauSac: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Kiểu dáng"
                                        value={newProduct.kieuDang}
                                        onChange={(e) => setNewProduct({ ...newProduct, kieuDang: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Chất liệu"
                                        value={newProduct.chatLieu}
                                        onChange={(e) => setNewProduct({ ...newProduct, chatLieu: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Size"
                                        value={newProduct.size}
                                        onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                                    />
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={isUploadingImages}
                                    />
                                    {isUploadingImages && <p style={{ color: '#D4AF37', fontSize: '13px', margin: '6px 0' }}>Đang tải ảnh lên Cloudflare R2...</p>}
                                    {newProduct.images && newProduct.images.length > 0 && (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '8px 0' }}>
                                            {newProduct.images.map((img, idx) => (
                                                <img key={idx} src={img.url} alt={`Preview ${idx}`} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)' }} />
                                            ))}
                                        </div>
                                    )}
                                    <div className={cx('form-actions')}>
                                        <button onClick={handleSaveProduct} disabled={isUploadingImages}>{isUploadingImages ? 'Đang tải ảnh...' : 'Lưu'}</button>
                                        <button onClick={() => setShowAddForm(false)}>Hủy</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={cx('search-bar')}>
                                        <input 
                                            type="text" 
                                            placeholder="Tìm kiếm sản phẩm..." 
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </div>

                                    <div className={cx('filter-controls')}>
                                        <div className={cx('filter-group')}>
                                            <label>Thương hiệu</label>
                                        <select value={brandFilter} onChange={handleBrandFilter}>
                                            <option value="">Tất cả thương hiệu</option>
                                            <option value="nike">Nike</option>
                                            <option value="gucci">Gucci</option>
                                            <option value="dior">Dior</option>
                                                <option value="prada">Prada</option>
                                                <option value="balenciaga">Balenciaga</option>
                                                <option value="adidas">Adidas</option>
                                                <option value="louis vuitton">Louis Vuitton</option>
                                        </select>
                                        </div>

                                        <div className={cx('filter-group')}>
                                            <label>Sắp xếp theo</label>
                                        <select value={priceSort} onChange={handlePriceSort}>
                                                <option value="">Mặc định</option>
                                            <option value="asc">Giá tăng dần</option>
                                            <option value="desc">Giá giảm dần</option>
                                                <option value="name-asc">Tên: A-Z</option>
                                                <option value="name-desc">Tên: Z-A</option>
                                        </select>
                                    </div>

                                        <div className={cx('filter-group')}>
                                            <label>Giới tính</label>
                                            <select value={genderFilter} onChange={handleGenderFilter}>
                                                <option value="">Tất cả</option>
                                                <option value="Nam">Nam</option>
                                                <option value="Nữ">Nữ</option>
                                                <option value="Unisex">Unisex</option>
                                            </select>
                                                    </div>
                                        
                                        <div className={cx('filter-group')}>
                                            <label>&nbsp;</label>
                                            <button
                                                onClick={clearFilters}
                                                className={cx('clear-filters-btn')}
                                            >
                                                <i className="fas fa-times-circle"></i>
                                                Xóa bộ lọc
                                            </button>
                                        </div>
                                    </div>

                                    <div className={cx('list-toolbar')}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                className={cx('add-product-btn')}
                                                onClick={handleAddProduct}
                                            >
                                                <i className="fas fa-plus-circle"></i>
                                                Thêm sản phẩm mới
                                            </button>
                                            <button
                                                className={cx('clean-btn')}
                                                onClick={handleCleanBase64Images}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.06)',
                                                    color: 'var(--color-text, #F5F5F7)',
                                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                                    borderRadius: 'var(--radius-full, 999px)',
                                                    padding: '10px 18px',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                                title="Tự động trích xuất ảnh hiện tại trong database tải lên Cloudflare R2 để giữ nguyên 100% ảnh và tăng tốc độ web"
                                            >
                                                <i className="fas fa-cloud-upload-alt" style={{ color: 'var(--color-gold, #D4AF37)' }}></i>
                                                Chuyển ảnh sang R2
                                            </button>
                                        </div>

                                        <div className={cx('product-count')}>
                                            {loadingProducts ? 'Đang tải sản phẩm...' : `Hiển thị ${filteredProducts.length} sản phẩm`}
                                        </div>
                                    </div>

                                    {!loadingProducts && filteredProducts.length > 0 && (
                                        <div className={cx('pagination')}>
                                            <button
                                                onClick={handlePrevPage}
                                                disabled={currentPage === 1}
                                                className={cx('pagination-btn')}
                                            >
                                                <i className="fas fa-chevron-left"></i> Trang trước
                                            </button>
                                            <span className={cx('pagination-info')}>
                                                Trang {currentPage} / {getTotalPages()}
                                            </span>
                                            <button
                                                onClick={handleNextPage}
                                                disabled={currentPage >= getTotalPages()}
                                                className={cx('pagination-btn')}
                                            >
                                                Trang sau <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </div>
                                    )}

                                    {loadingProducts ? (
                                        <div className={cx('products-loading-wrapper')}>
                                            <div className={cx('table-loading-spinner')}></div>
                                            <span className={cx('table-loading-text')}>Đang tải danh sách sản phẩm...</span>
                                        </div>
                                    ) : filteredProducts.length > 0 ? (
                                        <>
                                            <div className={cx('products-grid')}>
                                                {getProductsForCurrentPage().map((product) => (
                                                    <div key={product._id} className={cx('product-item')}>
                                                        <div className={cx('product-action-buttons')}>
                                                            <button 
                                                                className={cx('edit-btn')}
                                                                onClick={() => handleEditProduct(product._id)}
                                                                title="Chỉnh sửa sản phẩm"
                                                            >
                                                                <i className="fas fa-pencil-alt"></i>
                                                            </button>
                                                            <button 
                                                                className={cx('delete-btn')}
                                                                onClick={() => handleDeleteProduct(product._id)}
                                                                title="Xóa sản phẩm"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                        
                                                        <div
                                                            className={cx('product-image')}
                                                            onClick={() => handleOpenLightbox(product, 0)}
                                                            title="Ấn để xem ảnh to hơn"
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            <img
                                                                src={product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image'}
                                                                alt={product.name}
                                                            />
                                                            <div className={cx('product-img-zoom-hint')}>
                                                                <i className="fas fa-search-plus" />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className={cx('product-info')}>
                                                            <h3 className={cx('product-name')}>{product.name}</h3>
                                                            <p className={cx('product-price')}>
                                                                {formatCurrency(product.price)}
                                                            </p>
                                                            {product.brand && (
                                                                <div className={cx('product-brand')}>
                                                                    <i className="fas fa-tag"></i>
                                                                    {product.brand}
                                                                </div>
                                                            )}
                                                            <div className={cx('product-meta')}>
                                                                <span>
                                                                    <i className="fas fa-box"></i>
                                                                    Tồn kho: {product.stock || 0}
                                                                </span>
                                                                {product.gioiTinh && (
                                                                    <span>
                                                                        <i className="fas fa-user"></i>
                                                                        {product.gioiTinh}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className={cx('pagination')}>
                                                <button 
                                                    onClick={handlePrevPage} 
                                                    disabled={currentPage === 1}
                                                    className={cx('pagination-btn')}
                                                >
                                                    <i className="fas fa-chevron-left"></i> Trang trước
                                                </button>
                                                <span className={cx('pagination-info')}>
                                                    Trang {currentPage} / {getTotalPages()}
                                                </span>
                                                <button 
                                                    onClick={handleNextPage}
                                                    disabled={currentPage >= getTotalPages()}
                                                    className={cx('pagination-btn')}
                                                >
                                                    Trang sau <i className="fas fa-chevron-right"></i>
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        renderNoProductsMessage()
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            case 'chat':
                return (
                    <div className={cx('chat-management')}>
                        <h2>Quản lý cuộc hội thoại</h2>
                        
                        {!selectedConversation ? (
                            <>
                                <div className={cx('chat-actions')}>
                                    <div className={cx('conversation-search')}>
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm theo tên người dùng hoặc email..."
                                            value={conversationSearchTerm}
                                            onChange={handleConversationSearch}
                                        />
                                        <button><FontAwesomeIcon icon={faSearch} /></button>
                                    </div>
                                    
                                    <button 
                                        className={cx('refresh-btn')}
                                        onClick={fetchConversations}
                                    >
                                        <i className="fas fa-sync"></i>
                                        Làm mới
                                    </button>
                                </div>
                                
                                {/* Hiển thị bảng trên màn hình lớn */}
                                <div className={cx('conversations-table-container', 'd-none-mobile')}>
                                    <table className={cx('conversations-table')}>
                                        <thead>
                                            <tr>
                                                <th>Người dùng</th>
                                                <th>Email</th>
                                                <th>Tin nhắn cuối</th>
                                                <th>Cập nhật</th>
                                                <th>Tin nhắn chưa đọc</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chatLoading ? (
                                                <TableLoadingRow colSpan={6} message="Đang tải cuộc hội thoại..." />
                                            ) : filteredConversations.length > 0 ? (
                                                filteredConversations.map((conversation) => (
                                                    <tr key={conversation._id}>
                                                        <td>{conversation.userName || 'Khách'}</td>
                                                        <td>{conversation.userEmail || 'Không có email'}</td>
                                                        <td>{conversation.lastMessage || 'Chưa có tin nhắn'}</td>
                                                        <td>{formatDate(conversation.lastUpdated)}</td>
                                                        <td>
                                                            {conversation.unreadCount > 0 ? (
                                                                <span className={cx('unread-badge')}>{conversation.unreadCount}</span>
                                                            ) : 'Không có'}
                                                        </td>
                                                        <td>
                                                            <div className={cx('action-buttons')}>
                                                                <button
                                                                    className={cx('view-btn')}
                                                                    onClick={() => handleSelectConversation(conversation)}
                                                                    title="Xem cuộc hội thoại"
                                                                >
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </button>
                                                                <button
                                                                    className={cx('delete-btn')}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteConversation(conversation._id);
                                                                    }}
                                                                    title="Xóa cuộc hội thoại"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className={cx('no-data')}>Không tìm thấy cuộc hội thoại nào</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Hiển thị giao diện mobile */}
                                <div className={cx('conversation-mobile-list', 'd-block-mobile')}>
                                    {chatLoading ? (
                                        <MobileLoadingBox message="Đang tải cuộc hội thoại..." />
                                    ) : filteredConversations.length > 0 ? (
                                        filteredConversations.map((conversation) => (
                                            <div key={conversation._id} className={cx('conversation-mobile-item')}>
                                                <div className={cx('conversation-mobile-header')}>
                                                    <div className={cx('conversation-user')}>{conversation.userName || 'Khách'}</div>
                                                    <div className={cx('conversation-email')}>{conversation.userEmail || 'Không có email'}</div>
                                                    <div className={cx('conversation-preview')}>{conversation.lastMessage || 'Chưa có tin nhắn'}</div>
                                                    <div className={cx('conversation-time')}>{formatDate(conversation.lastUpdated)}</div>
                                                    {conversation.unreadCount > 0 && (
                                                        <div className={cx('unread-badge')}>{conversation.unreadCount} tin nhắn mới</div>
                                                    )}
                                                </div>
                                                <div className={cx('conversation-mobile-actions')}>
                                                    <button 
                                                        className={cx('view-btn')}
                                                        onClick={() => handleSelectConversation(conversation)}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} /> Xem
                                                    </button>
                                                    <button 
                                                        className={cx('delete-btn')}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteConversation(conversation._id);
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} /> Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={cx('no-data')}>Không tìm thấy cuộc hội thoại nào</div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <button 
                                    className={cx('back-btn')}
                                    onClick={() => setSelectedConversation(null)}
                                >
                                    <i className="fas fa-arrow-left"></i> Quay lại danh sách
                                </button>
                                
                                <div className={cx('chat-container')}>
                                    <div className={cx('chat-messages')}>
                                        <div className={cx('messages-header')}>
                                            <div className={cx('user-info')}>
                                                <h3>{selectedConversation.userName || 'Khách'}</h3>
                                                {selectedConversation.userEmail && (
                                                    <div className={cx('user-email')}>{selectedConversation.userEmail}</div>
                                                )}
                                            </div>
                                            <div className={cx('header-actions')}>
                                                <button 
                                                    onClick={() => handleDeleteConversation(selectedConversation._id)}
                                                    title="Xóa cuộc hội thoại"
                                                    className={cx('delete-conversation-btn')}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedConversation(null)}
                                                    title="Đóng"
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className={cx('messages-body')}>
                                            {chatLoading ? (
                                                <div className={cx('loading-messages')}>
                                                    <div className={cx('spinner')}></div>
                                                    Đang tải tin nhắn...
                                                </div>
                                            ) : messages.length > 0 ? (
                                                <>
                                                    {groupMessagesByDate(messages).map((group, groupIndex) => (
                                                        <div key={groupIndex}>
                                                            <div className={cx('chat-date-divider')}>
                                                                <span>{group.date}</span>
                                                            </div>
                                                            {group.messages.map((message) => (
                                                                <div 
                                                                    key={message._id} 
                                                                    className={cx('message', message.isAdmin ? 'admin-message' : 'user-message')}
                                                                >
                                                                    <div className={cx('message-bubble')}>
                                                                        {message.text}
                                                                    </div>
                                                                    <div className={cx('message-meta')}>
                                                                        <span>{message.isAdmin ? 'Admin' : message.senderName || 'Khách'}</span>
                                                                        <span>{formatChatTime(message.createdAt)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                    <div ref={messagesEndRef} /> {/* Auto scroll element */}
                                                </>
                                            ) : (
                                                <div className={cx('no-conversation')}>
                                                    <FontAwesomeIcon icon={faComments} />
                                                    <p>Chưa có tin nhắn nào trong cuộc hội thoại này</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className={cx('messages-footer')}>
                                            <form className={cx('message-form')} onSubmit={handleSendChatMessage}>
                                                <input
                                                    type="text"
                                                    placeholder="Nhập tin nhắn..."
                                                    value={newChatMessage}
                                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                                />
                                                <button type="submit" disabled={!newChatMessage.trim()}>
                                                    <FontAwesomeIcon icon={faPaperPlane} />
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            default:
                return <p>Chọn một mục từ menu bên trái</p>;
        }
    };

    const renderSidebar = () => {
        const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        const productsCount = dashboardStats.totalProducts || products.length;
        const invoicesCount = dashboardStats.totalOrders || invoices.length;
        const usersCount = dashboardStats.totalUsers || users.length;
        const adminInitial = (user?.name || 'A').charAt(0).toUpperCase();

        return (
            <>
                {/* Backdrop mờ phía sau trên mobile khi sidebar mở */}
                <div
                    className={cx('sidebar-backdrop', { 'backdrop-open': isSidebarOpen })}
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />

                <aside
                    className={cx('sidebar', {
                        'sidebar-closed': !isSidebarOpen,
                        'sidebar-collapsed': isSidebarCollapsed
                    })}
                    aria-label="Thanh điều hướng quản trị"
                >
                    {/* Brand Header */}
                    <div className={cx('sidebar-brand', { 'brand-collapsed': isSidebarCollapsed })}>
                        {isSidebarCollapsed ? (
                            <button
                                type="button"
                                className={cx('collapsed-brand-toggle')}
                                onClick={toggleCollapse}
                                title="Mở rộng thanh menu"
                                aria-label="Mở rộng thanh menu"
                            >
                                <div className={cx('brand-logo')}>
                                    <FontAwesomeIcon icon={faShieldAlt} className={cx('brand-icon')} />
                                </div>
                                <span className={cx('collapsed-chevron-badge')}>
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </span>
                            </button>
                        ) : (
                            <>
                                <div className={cx('brand-identity')}>
                                    <div className={cx('brand-logo')} title="TEAM2HAND Portal Quản trị">
                                        <FontAwesomeIcon icon={faShieldAlt} className={cx('brand-icon')} />
                                    </div>
                                    <div className={cx('brand-text-stack')}>
                                        <span className={cx('brand-name')}>TEAM2HAND</span>
                                        <span className={cx('brand-badge')}>PORTAL QUẢN TRỊ</span>
                                    </div>
                                </div>
                                <div className={cx('brand-actions')}>
                                    <button
                                        type="button"
                                        className={cx('toggle-collapse-btn')}
                                        onClick={toggleCollapse}
                                        title="Thu gọn thanh menu"
                                        aria-label="Thu gọn thanh menu"
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </button>
                                    <button
                                        type="button"
                                        className={cx('close-sidebar-btn')}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setIsSidebarOpen(false);
                                        }}
                                        aria-label="Đóng menu"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Scrollable Navigation Area */}
                    <div className={cx('sidebar-scroll')}>
                        {/* Nhóm 1: TỔNG QUAN */}
                        <div className={cx('sidebar-group')}>
                            {!isSidebarCollapsed && (
                                <span className={cx('sidebar-group-title')}>Tổng quan</span>
                            )}
                            <ul className={cx('sidebar-menu')}>
                                <li className={cx('sidebar-item')}>
                                    <button
                                        type="button"
                                        className={cx('sidebar-link', { active: activeTab === 'dashboard' })}
                                        onClick={() => handleMenuItemClick('dashboard')}
                                        title={isSidebarCollapsed ? "Bảng điều khiển" : undefined}
                                    >
                                        <div className={cx('sidebar-link-main')}>
                                            <div className={cx('sidebar-icon-box')}>
                                                <FontAwesomeIcon icon={faTachometerAlt} />
                                            </div>
                                            <span className={cx('sidebar-text')}>Bảng điều khiển</span>
                                        </div>
                                        <span className={cx('active-indicator')} />
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Nhóm 2: CỬA HÀNG & KHO */}
                        <div className={cx('sidebar-group')}>
                            {!isSidebarCollapsed ? (
                                <span className={cx('sidebar-group-title')}>Cửa hàng & Kho</span>
                            ) : (
                                <div className={cx('sidebar-group-divider')} />
                            )}
                            <ul className={cx('sidebar-menu')}>
                                <li className={cx('sidebar-item')}>
                                    <button
                                        type="button"
                                        className={cx('sidebar-link', { active: activeTab === 'products' })}
                                        onClick={() => handleMenuItemClick('products')}
                                        title={isSidebarCollapsed ? `Quản lý sản phẩm (${productsCount})` : undefined}
                                    >
                                        <div className={cx('sidebar-link-main')}>
                                            <div className={cx('sidebar-icon-box')}>
                                                <FontAwesomeIcon icon={faBox} />
                                                {isSidebarCollapsed && productsCount > 0 && (
                                                    <span className={cx('sidebar-badge-mini')}>
                                                        {productsCount > 99 ? '99+' : productsCount}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cx('sidebar-text')}>Quản lý sản phẩm</span>
                                        </div>
                                        {!isSidebarCollapsed && productsCount > 0 && (
                                            <span className={cx('sidebar-badge')}>{productsCount}</span>
                                        )}
                                        <span className={cx('active-indicator')} />
                                    </button>
                                </li>
                                <li className={cx('sidebar-item')}>
                                    <button
                                        type="button"
                                        className={cx('sidebar-link', { active: activeTab === 'invoices' })}
                                        onClick={() => handleMenuItemClick('invoices')}
                                        title={isSidebarCollapsed ? `Quản lý hóa đơn (${invoicesCount})` : undefined}
                                    >
                                        <div className={cx('sidebar-link-main')}>
                                            <div className={cx('sidebar-icon-box')}>
                                                <FontAwesomeIcon icon={faFileInvoice} />
                                                {isSidebarCollapsed && invoicesCount > 0 && (
                                                    <span className={cx('sidebar-badge-mini')}>
                                                        {invoicesCount > 99 ? '99+' : invoicesCount}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cx('sidebar-text')}>Quản lý hóa đơn</span>
                                        </div>
                                        {!isSidebarCollapsed && invoicesCount > 0 && (
                                            <span className={cx('sidebar-badge')}>{invoicesCount}</span>
                                        )}
                                        <span className={cx('active-indicator')} />
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Nhóm 3: DỊCH VỤ & HỖ TRỢ */}
                        <div className={cx('sidebar-group')}>
                            {!isSidebarCollapsed ? (
                                <span className={cx('sidebar-group-title')}>Dịch vụ & Khách hàng</span>
                            ) : (
                                <div className={cx('sidebar-group-divider')} />
                            )}
                            <ul className={cx('sidebar-menu')}>
                                <li className={cx('sidebar-item')}>
                                    <button
                                        type="button"
                                        className={cx('sidebar-link', { active: activeTab === 'users' })}
                                        onClick={() => handleMenuItemClick('users')}
                                        title={isSidebarCollapsed ? `Quản lý người dùng (${usersCount})` : undefined}
                                    >
                                        <div className={cx('sidebar-link-main')}>
                                            <div className={cx('sidebar-icon-box')}>
                                                <FontAwesomeIcon icon={faUsers} />
                                                {isSidebarCollapsed && usersCount > 0 && (
                                                    <span className={cx('sidebar-badge-mini')}>
                                                        {usersCount > 99 ? '99+' : usersCount}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cx('sidebar-text')}>Quản lý người dùng</span>
                                        </div>
                                        {!isSidebarCollapsed && usersCount > 0 && (
                                            <span className={cx('sidebar-badge')}>{usersCount}</span>
                                        )}
                                        <span className={cx('active-indicator')} />
                                    </button>
                                </li>
                                <li className={cx('sidebar-item')}>
                                    <button
                                        type="button"
                                        className={cx('sidebar-link', { active: activeTab === 'chat' })}
                                        onClick={() => handleMenuItemClick('chat')}
                                        title={isSidebarCollapsed ? (totalUnreadMessages > 0 ? `Hội thoại & Hỗ trợ (${totalUnreadMessages} tin mới)` : "Hội thoại & Hỗ trợ") : undefined}
                                    >
                                        <div className={cx('sidebar-link-main')}>
                                            <div className={cx('sidebar-icon-box')}>
                                                <FontAwesomeIcon icon={faComments} />
                                                {isSidebarCollapsed && totalUnreadMessages > 0 && (
                                                    <span className={cx('sidebar-badge-mini', 'badge-unread-mini')}>
                                                        <span className={cx('pulse-dot')} />
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cx('sidebar-text')}>Hội thoại & Hỗ trợ</span>
                                        </div>
                                        {!isSidebarCollapsed && (
                                            totalUnreadMessages > 0 ? (
                                                <span className={cx('sidebar-badge', 'badge-unread')}>
                                                    <span className={cx('pulse-dot')} />
                                                    {totalUnreadMessages}
                                                </span>
                                            ) : conversations.length > 0 ? (
                                                <span className={cx('sidebar-badge')}>{conversations.length}</span>
                                            ) : null
                                        )}
                                        <span className={cx('active-indicator')} />
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Docked Executive Footer */}
                    <div className={cx('sidebar-footer', { 'footer-collapsed': isSidebarCollapsed })}>
                        <div
                            className={cx('admin-profile-card')}
                            title={isSidebarCollapsed ? `${user?.name || 'Administrator'} • Quản trị viên` : undefined}
                        >
                            <div className={cx('profile-avatar-wrap')}>
                                <div className={cx('profile-avatar')}>
                                    {adminInitial}
                                </div>
                                <span className={cx('status-dot')} title="Đang trực tuyến" />
                            </div>
                            {!isSidebarCollapsed && (
                                <div className={cx('profile-info')}>
                                    <span className={cx('profile-name')} title={user?.name || 'Administrator'}>
                                        {user?.name || 'Administrator'}
                                    </span>
                                    <span className={cx('profile-role')}>
                                        <FontAwesomeIcon icon={faCrown} className={cx('crown-icon')} /> Quản trị viên
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className={cx('footer-actions')}>
                            <div className={cx('theme-toggle-wrap')} title="Chuyển chế độ Sáng / Tối">
                                <ThemeToggle compact={isSidebarCollapsed} />
                            </div>
                            <button
                                type="button"
                                className={cx('logout-button')}
                                onClick={async () => {
                                    if (window.innerWidth <= 768) setIsSidebarOpen(false);
                                    await logout();
                                    navigate('/login');
                                }}
                                title="Đăng xuất khỏi hệ thống"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} />
                                {!isSidebarCollapsed && <span>Đăng xuất</span>}
                            </button>
                        </div>
                    </div>
                </aside>
            </>
        );
    };

    const formatChatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatChatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
    };

    const groupMessagesByDate = (messages) => {
        const groups = {};
        
        messages.forEach(message => {
            const date = new Date(message.createdAt);
            const dateString = date.toLocaleDateString('vi-VN');
            
            if (!groups[dateString]) {
                groups[dateString] = [];
            }
            
            groups[dateString].push(message);
        });
        
        return Object.entries(groups).map(([date, messages]) => ({
            date,
            messages
        }));
    };

    const handleDeleteConversation = async (conversationId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc hội thoại này? Tất cả tin nhắn sẽ bị xóa vĩnh viễn.')) {
            return;
        }
        
        try {
            setChatLoading(true);
            const response = await axios.delete(`${API_URL}/chat/conversation/${conversationId}`, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                setConversations(prev => prev.filter(conv => conv._id !== conversationId));
                setFilteredConversations(prev => prev.filter(conv => conv._id !== conversationId));
                
                if (selectedConversation && selectedConversation._id === conversationId) {
                    setSelectedConversation(null);
                    setMessages([]);
                }
                
                showToast({
                    title: "Thành công",
                    message: "Đã xóa cuộc hội thoại thành công",
                    type: "success",
                    duration: 3000
                });
            } else {
                throw new Error(response.data.message || "Không thể xóa cuộc hội thoại");
            }
        } catch (error) {
            console.error('Lỗi khi xóa cuộc hội thoại:', error);
            showToast({
                title: "Lỗi",
                message: error.response?.data?.message || "Không thể xóa cuộc hội thoại",
                type: "error",
                duration: 3000
            });
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className={cx('admin-container')}>
            {renderSidebar()}
            
            <div
                className={cx('content', {
                    'content-expanded': !isSidebarOpen,
                    'content-collapsed-sidebar': isSidebarCollapsed && isSidebarOpen
                })}
            >
                <div className={cx('header')}>
                    <div className={cx('header-left')}>
                        <button
                            type="button"
                            className={cx('hamburger-btn')}
                            onClick={toggleSidebar}
                            title={isSidebarCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
                            aria-label="Đóng mở menu"
                        >
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                        <h2>
                            {activeTab === 'dashboard' && 'Bảng điều khiển'}
                            {activeTab === 'products' && 'Quản lý sản phẩm'}
                            {activeTab === 'invoices' && 'Quản lý hóa đơn'}
                            {activeTab === 'users' && 'Quản lý người dùng'}
                            {activeTab === 'chat' && 'Quản lý cuộc hội thoại'}
                        </h2>
                    </div>
                </div>
                
                {renderContent()}
            </div>
            {/* Bảng QuickView chỉnh sửa nhanh sản phẩm (Desktop trượt từ phải sang trái, Mobile trượt từ dưới lên) */}
            <QuickView
                isOpen={showEditForm && !!editingProduct}
                onClose={() => {
                    setShowEditForm(false);
                    setEditingProduct(null);
                    setProductImages([]);
                }}
                title="Chỉnh sửa nhanh"
                subtitle={`${editingProduct?.brand ? editingProduct.brand + ' • ' : ''}${editingProduct?.code || ''}`}
                width="560px"
                extraHeader={
                    <button
                        type="button"
                        className={cx('quickview-open-detail-btn')}
                        onClick={() => {
                            const prodId = editingProduct?._id;
                            setShowEditForm(false);
                            setEditingProduct(null);
                            setProductImages([]);
                            navigate(`/admin/product/${prodId}`);
                        }}
                        title="Mở trang chỉnh sửa chi tiết toàn diện"
                    >
                        <i className="fas fa-external-link-alt" />
                        <span>Chỉnh sửa chi tiết</span>
                    </button>
                }
                footer={
                    <div className={cx('quickview-footer-wrapper')}>
                        <button
                            type="button"
                            className={cx('quickview-full-detail-link')}
                            onClick={() => {
                                const prodId = editingProduct?._id;
                                setShowEditForm(false);
                                setEditingProduct(null);
                                setProductImages([]);
                                navigate(`/admin/product/${prodId}`);
                            }}
                        >
                            <i className="fas fa-edit" />
                            <span>Mở trang chi tiết</span>
                        </button>
                        <div className={cx('quickview-action-group')}>
                            <button
                                type="button"
                                className={cx('cancel-btn')}
                                onClick={() => {
                                    setShowEditForm(false);
                                    setEditingProduct(null);
                                    setProductImages([]);
                                }}
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                className={cx('save-btn')}
                                onClick={handleUpdateProduct}
                                disabled={isUploadingImages}
                            >
                                <i className={`fas ${isUploadingImages ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                                {isUploadingImages ? 'Đang tải ảnh...' : 'Lưu nhanh'}
                            </button>
                        </div>
                    </div>
                }
            >
                {editingProduct && (
                    <div className={cx('quick-edit-form')}>
                        {/* Ảnh xem trước & nút upload R2 nhanh */}
                        <div className={cx('quick-image-box')}>
                            <div
                                className={cx('quick-img-thumb')}
                                onClick={() => handleOpenLightbox(editingProduct, 0)}
                                title="Ấn để xem ảnh to hơn"
                                role="button"
                                tabIndex={0}
                            >
                                <img
                                    src={editingProduct.images?.[0]?.url || 'https://via.placeholder.com/120'}
                                    alt={editingProduct.name}
                                />
                                <div className={cx('quick-img-zoom-hint')}>
                                    <i className="fas fa-search-plus" />
                                </div>
                                {editingProduct.images && editingProduct.images.length > 1 && (
                                    <span className={cx('quick-img-count')}>
                                        +{editingProduct.images.length - 1} ảnh
                                    </span>
                                )}
                            </div>
                            <div className={cx('quick-img-meta')}>
                                <div className={cx('quick-img-header')}>
                                    <span className={cx('quick-r2-tag')}>
                                        <i className="fas fa-bolt" /> Cloudflare R2
                                    </span>
                                    <span className={cx('quick-img-total')}>
                                        {editingProduct.images?.length || 0} ảnh
                                    </span>
                                </div>
                                <label className={cx('quick-upload-label')}>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        disabled={isUploadingImages}
                                        className={cx('quick-file-input')}
                                    />
                                    <span className={cx('quick-upload-btn-styled')}>
                                        <i className={`fas ${isUploadingImages ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'}`} />
                                        {isUploadingImages ? 'Đang tải lên R2...' : 'Tải thêm ảnh lên R2'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Tên sản phẩm */}
                        <div className={cx('form-group')}>
                            <label>Tên sản phẩm *</label>
                            <input
                                type="text"
                                value={editingProduct.name}
                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                placeholder="Nhập tên sản phẩm"
                            />
                        </div>

                        {/* Giá & Số lượng */}
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label>Giá (VNĐ) *</label>
                                <input
                                    type="number"
                                    value={editingProduct.price}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                    placeholder="Nhập giá"
                                />
                            </div>

                            <div className={cx('form-group')}>
                                <label>Số lượng trong kho</label>
                                <input
                                    type="number"
                                    value={editingProduct.stock ?? 1}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                                    placeholder="Nhập số lượng"
                                    min={0}
                                />
                            </div>
                        </div>

                        {/* Thương hiệu & Loại sản phẩm */}
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label>Thương hiệu</label>
                                <input
                                    type="text"
                                    value={editingProduct.brand || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                    placeholder="PRADA, GUCCI..."
                                />
                            </div>

                            <div className={cx('form-group')}>
                                <label>Loại sản phẩm</label>
                                <select
                                    value={editingProduct.category || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                >
                                    <option value="">Chọn loại</option>
                                    <option value="shirt">Áo</option>
                                    <option value="pants">Quần</option>
                                    <option value="shoes">Giày</option>
                                    <option value="accessories">Phụ kiện</option>
                                </select>
                            </div>
                        </div>

                        {/* Giới tính & Màu sắc */}
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label>Giới tính</label>
                                <select
                                    value={editingProduct.gioiTinh || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, gioiTinh: e.target.value })}
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Unisex">Unisex</option>
                                </select>
                            </div>

                            <div className={cx('form-group')}>
                                <label>Màu sắc</label>
                                <input
                                    type="text"
                                    value={editingProduct.mauSac || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, mauSac: e.target.value })}
                                    placeholder="Màu sắc"
                                />
                            </div>
                        </div>

                        {/* Size & Chất liệu */}
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label>Size</label>
                                <input
                                    type="text"
                                    value={editingProduct.size || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })}
                                    placeholder="S, M, L, XL..."
                                />
                            </div>

                            <div className={cx('form-group')}>
                                <label>Chất liệu</label>
                                <input
                                    type="text"
                                    value={editingProduct.chatLieu || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, chatLieu: e.target.value })}
                                    placeholder="Cotton, Denim..."
                                />
                            </div>
                        </div>

                        {/* Mô tả ngắn */}
                        <div className={cx('form-group')}>
                            <label>Mô tả sản phẩm</label>
                            <textarea
                                value={editingProduct.description || ''}
                                onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                placeholder="Nhập mô tả sản phẩm..."
                                rows={3}
                            />
                        </div>
                    </div>
                )}
            </QuickView>

            {/* Bảng QuickView xem chi tiết đơn hàng / hóa đơn (Desktop trượt từ phải sang trái, Mobile trượt từ dưới lên) */}
            <QuickView
                isOpen={showInvoiceModal && !!selectedInvoice}
                onClose={() => {
                    setShowInvoiceModal(false);
                    setSelectedInvoice(null);
                }}
                title={`Chi tiết đơn hàng #${selectedInvoice?._id ? selectedInvoice._id.slice(-6).toUpperCase() : ''}`}
                subtitle={selectedInvoice?.createdAt ? `Đặt lúc: ${formatDate(selectedInvoice.createdAt)}` : ''}
                width="640px"
                extraHeader={
                    selectedInvoice && (
                        <span
                            className={cx('status', 'quickview-order-status-badge', {
                                'pending': selectedInvoice.orderStatus === 'Processing',
                                'processing': selectedInvoice.orderStatus === 'Processing',
                                'shipped': selectedInvoice.orderStatus === 'Shipped',
                                'delivered': selectedInvoice.orderStatus === 'Delivered',
                                'cancelled': selectedInvoice.orderStatus === 'Cancelled',
                            })}
                        >
                            {getStatusVietnamese(selectedInvoice.orderStatus)}
                        </span>
                    )
                }
                footer={
                    <div className={cx('quickview-invoice-footer')}>
                        {selectedInvoice && selectedInvoice.orderStatus !== 'Delivered' && selectedInvoice.orderStatus !== 'Cancelled' && (
                            <button
                                type="button"
                                className={cx('cancel-order-btn')}
                                onClick={() => handleCancelOrder(selectedInvoice._id)}
                            >
                                <i className="fas fa-ban" />
                                <span>Hủy đơn hàng</span>
                            </button>
                        )}
                        <button
                            type="button"
                            className={cx('delete-order-btn')}
                            onClick={() => {
                                handleRemoveOrder(selectedInvoice._id);
                            }}
                        >
                            <i className="fas fa-trash" />
                            <span>Xóa đơn hàng</span>
                        </button>
                        <button
                            type="button"
                            className={cx('close-modal-btn')}
                            onClick={() => {
                                setShowInvoiceModal(false);
                                setSelectedInvoice(null);
                            }}
                        >
                            Đóng
                        </button>
                    </div>
                }
            >
                {selectedInvoice && (
                    <div className={cx('quickview-invoice-body')}>
                        {/* Thẻ 1: Thông tin khách hàng & giao hàng */}
                        <div className={cx('invoice-section-card')}>
                            <div className={cx('invoice-section-header')}>
                                <h4>
                                    <i className="fas fa-user-circle" />
                                    <span>Thông tin khách hàng & Giao hàng</span>
                                </h4>
                            </div>
                            <div className={cx('invoice-info-grid')}>
                                <div className={cx('invoice-info-item')}>
                                    <span className={cx('info-label')}>Họ tên</span>
                                    <span className={cx('info-value')}>{selectedInvoice.shippingInfo?.fullName || 'Chưa cập nhật'}</span>
                                </div>
                                <div className={cx('invoice-info-item')}>
                                    <span className={cx('info-label')}>Số điện thoại</span>
                                    <span className={cx('info-value')}>{selectedInvoice.shippingInfo?.phoneNo || 'Chưa cập nhật'}</span>
                                </div>
                                <div className={cx('invoice-info-item')}>
                                    <span className={cx('info-label')}>Email</span>
                                    <span className={cx('info-value')}>{selectedInvoice.user?.email || 'Chưa cập nhật'}</span>
                                </div>
                                <div className={cx('invoice-info-item')}>
                                    <span className={cx('info-label')}>Phương thức TT</span>
                                    <span className={cx('info-value')}>
                                        {selectedInvoice.paymentMethod === 'Banking'
                                            ? 'Chuyển khoản ngân hàng'
                                            : 'Thanh toán khi nhận hàng (COD)'}
                                    </span>
                                </div>
                                <div className={cx('invoice-info-item', 'full-width')}>
                                    <span className={cx('info-label')}>Địa chỉ nhận hàng</span>
                                    <span className={cx('info-value')}>
                                        {[selectedInvoice.shippingInfo?.address, selectedInvoice.shippingInfo?.city]
                                            .filter(Boolean)
                                            .join(', ') || 'Chưa cập nhật'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Thẻ 2: Chi tiết sản phẩm trong đơn */}
                        <div className={cx('invoice-section-card')}>
                            <div className={cx('invoice-section-header')}>
                                <h4>
                                    <i className="fas fa-box-open" />
                                    <span>Sản phẩm trong đơn ({selectedInvoice.orderItems?.length || 0})</span>
                                </h4>
                            </div>
                            <div className={cx('invoice-items-list')}>
                                {selectedInvoice.orderItems && selectedInvoice.orderItems.length > 0 ? (
                                    selectedInvoice.orderItems.map((item, index) => {
                                        const itemImg = item.images?.[0]?.url || item.image || item.imageUrl || 'https://via.placeholder.com/60';
                                        return (
                                            <div key={index} className={cx('invoice-item-row')}>
                                                <div
                                                    className={cx('invoice-item-thumb')}
                                                    onClick={() => {
                                                        if (itemImg) {
                                                            handleOpenLightbox({
                                                                name: item.name,
                                                                images: item.images?.length ? item.images : [{ url: itemImg }]
                                                            }, 0);
                                                        }
                                                    }}
                                                    title="Ấn để xem ảnh to hơn"
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <img src={itemImg} alt={item.name} />
                                                </div>
                                                <div className={cx('invoice-item-info')}>
                                                    <h5 className={cx('invoice-item-name')} title={item.name}>
                                                        {item.name}
                                                    </h5>
                                                    <div className={cx('invoice-item-meta')}>
                                                        <span className={cx('qty-badge')}>SL: {item.quantity}</span>
                                                        <span className={cx('unit-price')}>Đơn giá: {formatCurrency(item.price)}</span>
                                                    </div>
                                                </div>
                                                <div className={cx('invoice-item-price')}>
                                                    <div className={cx('item-total')}>
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className={cx('no-data')}>Không có sản phẩm nào</div>
                                )}
                            </div>
                        </div>

                        {/* Thẻ 3: Tóm tắt thanh toán */}
                        <div className={cx('invoice-section-card')}>
                            <div className={cx('invoice-section-header')}>
                                <h4>
                                    <i className="fas fa-receipt" />
                                    <span>Tóm tắt thanh toán</span>
                                </h4>
                            </div>
                            <div className={cx('invoice-summary-box')}>
                                <div className={cx('summary-line')}>
                                    <span>Tổng tiền hàng:</span>
                                    <span>{formatCurrency(selectedInvoice.itemsPrice || 0)}</span>
                                </div>
                                <div className={cx('summary-line')}>
                                    <span>Phí vận chuyển:</span>
                                    <span>{formatCurrency(selectedInvoice.shippingPrice || 0)}</span>
                                </div>
                                <div className={cx('summary-line')}>
                                    <span>Thuế VAT:</span>
                                    <span>{formatCurrency(selectedInvoice.taxPrice || 0)}</span>
                                </div>
                                <div className={cx('summary-line', 'divider', 'grand-total')}>
                                    <span>Tổng thanh toán:</span>
                                    <span>{formatCurrency(selectedInvoice.totalPrice || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </QuickView>

            {/* Bảng QuickView thêm/sửa người dùng nhanh (Desktop trượt từ phải sang trái, Mobile BottomSheet trượt từ dưới lên) */}
            <QuickView
                isOpen={showUserModal}
                onClose={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                }}
                title={isEditingUser ? "Chỉnh sửa nhanh người dùng" : "Thêm người dùng mới"}
                subtitle={isEditingUser ? (newUser.email || `ID: #${selectedUser?._id?.slice(-6).toUpperCase()}`) : "Tạo tài khoản người dùng hoặc quản trị viên"}
                width="540px"
                extraHeader={
                    isEditingUser && selectedUser?._id && (
                        <button
                            type="button"
                            className={cx('quickview-open-detail-btn')}
                            onClick={() => {
                                const uId = selectedUser._id;
                                setShowUserModal(false);
                                setSelectedUser(null);
                                navigate(`/admin/users/${uId}`);
                            }}
                            title="Mở trang chi tiết tài khoản và lịch sử đơn hàng"
                        >
                            <i className="fas fa-external-link-alt" />
                            <span>Chi tiết hồ sơ</span>
                        </button>
                    )
                }
                footer={
                    <div className={cx('quickview-user-footer')}>
                        {isEditingUser && selectedUser?._id ? (
                            <button
                                type="button"
                                className={cx('quickview-full-detail-link')}
                                onClick={() => {
                                    const uId = selectedUser._id;
                                    setShowUserModal(false);
                                    setSelectedUser(null);
                                    navigate(`/admin/users/${uId}`);
                                }}
                            >
                                <i className="fas fa-user-edit" />
                                <span>Xem toàn bộ hồ sơ & đơn hàng</span>
                            </button>
                        ) : <div />}
                        <div className={cx('quickview-action-group')}>
                            <button
                                type="button"
                                className={cx('cancel-btn')}
                                onClick={() => {
                                    setShowUserModal(false);
                                    setSelectedUser(null);
                                }}
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                className={cx('save-btn')}
                                onClick={handleSaveUser}
                            >
                                <i className="fas fa-check" />
                                <span>{isEditingUser ? "Lưu thay đổi" : "Tạo người dùng"}</span>
                            </button>
                        </div>
                    </div>
                }
            >
                <div className={cx('quickview-user-body')}>
                    {isEditingUser && selectedUser && (
                        <div className={cx('user-quick-profile-badge')}>
                            <div className={cx('user-quick-avatar', selectedUser.role === 'admin' ? 'admin' : '')}>
                                {newUser.name ? newUser.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className={cx('user-quick-meta')}>
                                <h4 className={cx('user-quick-name')}>{newUser.name || 'Người dùng'}</h4>
                                <p className={cx('user-quick-email')}>{newUser.email}</p>
                            </div>
                            <span className={cx('role', {
                                'admin': newUser.role === 'admin',
                                'user': newUser.role === 'user'
                            })}>
                                {newUser.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                        </div>
                    )}

                    <div className={cx('form-group')}>
                        <label>
                            Họ và tên <span style={{ color: 'var(--color-price, #FF3B30)' }}>*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Nhập họ và tên đầy đủ"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label>
                            Email đăng nhập <span style={{ color: 'var(--color-price, #FF3B30)' }}>*</span>
                        </label>
                        <input
                            type="email"
                            placeholder="example@domain.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                    </div>

                    <div className={cx('form-row')}>
                        <div className={cx('form-group')}>
                            <label>Số điện thoại</label>
                            <input
                                type="text"
                                placeholder="0912 345 678"
                                value={newUser.phone}
                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value, phoneNumber: e.target.value })}
                            />
                        </div>

                        <div className={cx('form-group')}>
                            <label>
                                Vai trò tài khoản <span style={{ color: 'var(--color-price, #FF3B30)' }}>*</span>
                            </label>
                            <select
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            >
                                <option value="user">Người dùng (User)</option>
                                <option value="admin">Quản trị viên (Admin)</option>
                            </select>
                        </div>
                    </div>

                    <div className={cx('form-group')}>
                        <label>
                            {isEditingUser ? 'Đặt lại mật khẩu mới' : 'Mật khẩu khởi tạo '}
                            {!isEditingUser && <span style={{ color: 'var(--color-price, #FF3B30)' }}>*</span>}
                        </label>
                        <input
                            type="password"
                            placeholder={isEditingUser ? "Để trống nếu không đổi mật khẩu (tối thiểu 6 ký tự)" : "Nhập mật khẩu (tối thiểu 6 ký tự)"}
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                        {isEditingUser && (
                            <small style={{ color: 'var(--color-text-secondary, #A1A1A6)', marginTop: '4px', display: 'block' }}>
                                Chỉ nhập nếu muốn đặt lại mật khẩu cho tài khoản này.
                            </small>
                        )}
                    </div>

                    <div className={cx('form-group')}>
                        <label>Địa chỉ liên hệ</label>
                        <input
                            type="text"
                            placeholder="Số nhà, tên đường, quận/huyện, tỉnh/thành"
                            value={newUser.address}
                            onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                        />
                    </div>
                </div>
            </QuickView>

            {/* Modal phóng to ảnh Lightbox */}
            <ImageLightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                images={lightboxImages}
                initialIndex={lightboxIndex}
                title={lightboxTitle}
                subtitle={lightboxSubtitle}
            />
        </div>
    );
}

export default Admin;