import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import * as styles from './ChatBox.module.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.js';
import { showToast } from '../Toast/index.js';
import { useLocation, useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

const ChatBox = () => {
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const chatButtonRef = useRef(null);
    const chatBoxRef = useRef(null);
    const messagesEndRef = useRef(null);
    const { user: currentUser, token } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Log trạng thái đăng nhập để debug
    useEffect(() => {
        console.log('Auth state:', { isLoggedIn: !!currentUser, currentUser, token });
    }, [currentUser, token]);
    
    // Kiểm tra xem có hiển thị chatbox không dựa trên đường dẫn
    const shouldShowChatbox = () => {
        // Nếu không có useLocation (vì một số lý do), vẫn trả về true để hiển thị
        if (!location || !location.pathname) return true;
        
        const path = location.pathname;
        // Không hiển thị ở các trang LoginandRegister, Admin, và Info
        return !path.includes('/login') && !path.includes('/register') && 
               !path.includes('/admin') && !path.includes('/info');
    };
    
    // State để lưu trữ ID khách nếu không đăng nhập
    const [guestId, setGuestId] = useState(() => {
        const savedGuestId = localStorage.getItem('guest_chat_id');
        return savedGuestId || null;
    });

    // Toggle hiển thị chat box
    const toggleChat = () => {
        setShowChat(prev => !prev);
        
        // Xóa chatbox cũ nếu đang đóng
        if (showChat) {
            const chatBox = document.getElementById("floating-chat-box");
            if (chatBox) {
                chatBox.remove();
                chatBoxRef.current = null;
            }
        }
    };

    // Hàm đóng chat box từ nút đóng
    const closeChat = () => {
        setShowChat(false);
        const chatBox = document.getElementById("floating-chat-box");
        if (chatBox) {
            chatBox.remove();
            chatBoxRef.current = null;
        }
    };

    // Lấy hoặc tạo cuộc hội thoại
    const getOrCreateConversation = async () => {
        try {
            // Nếu người dùng chưa đăng nhập, không thực hiện API call
            if (!currentUser || !token) {
                console.log('Không thể lấy cuộc hội thoại: Người dùng chưa đăng nhập');
                return;
            }
            
            setLoading(true);
            
            // Lấy cuộc hội thoại của user đã đăng nhập
            console.log('Gửi request lấy cuộc hội thoại với token:', token);
            const response = await axios.get(`${API_URL}/chat/conversation`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            console.log('Kết quả lấy cuộc hội thoại:', response.data);
            if (response.data.success) {
                const isNewConversation = !response.data.conversation.lastMessage;
                setConversation(response.data.conversation);
                
                // Lấy tin nhắn của cuộc hội thoại
                await fetchMessages(response.data.conversation._id);
                
                // Nếu là cuộc hội thoại mới và không có tin nhắn, gửi tin nhắn chào mừng
                if (isNewConversation && messages.length === 0) {
                    console.log('Cuộc hội thoại mới, hiển thị tin nhắn chào mừng');
                    // Thêm tin nhắn giả
                    setMessages([{
                        _id: 'welcome-message',
                        isAdmin: true,
                        text: 'Chào mừng bạn đến với hệ thống hỗ trợ trực tuyến. Hãy để lại câu hỏi, chúng tôi sẽ phản hồi sớm nhất có thể!',
                        createdAt: new Date(),
                        senderName: 'Hệ thống'
                    }]);
                }
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Lỗi khi lấy cuộc hội thoại:', error.response?.data || error.message);
            setError('Không thể kết nối với hệ thống chat. Vui lòng thử lại sau.');
            setLoading(false);
            
            showToast({
                title: "Lỗi",
                message: "Không thể kết nối với hệ thống chat",
                type: "error",
                duration: 3000
            });
        }
    };
    
    // Lấy tin nhắn của cuộc hội thoại
    const fetchMessages = async (conversationId) => {
        if (!conversationId || !token) {
            console.log('Không thể lấy tin nhắn: thiếu conversationId hoặc token');
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/chat/messages/${conversationId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data && response.data.success) {
                setMessages(response.data.messages || []);
                setError(null);
            } else {
                console.error('Lỗi khi lấy tin nhắn:', response.data);
                setError('Không thể tải tin nhắn');
            }
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error.response?.data || error.message);
            setError(error.response?.data?.message || 'Lỗi khi tải tin nhắn');
        } finally {
            setLoading(false);
        }
    };

    // Cuộn xuống tin nhắn cuối cùng
    const scrollToBottom = () => {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    // Hàm làm mới tin nhắn với thông báo
    const refreshMessages = () => {
        if (!conversation) {
            console.log('Không thể làm mới: Không có cuộc trò chuyện');
            return;
        }
        
        // Hiển thị thông báo đang làm mới
        setLoading(true);
        
        // Thêm animation xoay khi đang làm mới
        const refreshBtn = document.getElementById('refresh-messages-btn');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
            }
        }
        
        // Fetch tin nhắn mới và cập nhật giao diện
        fetchMessages(conversation._id)
            .then(() => {
                // Thông báo thành công (tùy chọn)
                console.log('Đã làm mới tin nhắn');
                // Cuộn xuống tin nhắn cuối cùng
                scrollToBottom();
            })
            .catch(err => {
                console.error('Lỗi khi làm mới tin nhắn:', err);
            })
            .finally(() => {
                // Dừng animation xoay
                if (refreshBtn) {
                    const icon = refreshBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-spin');
                    }
                }
            });
    };

    // Gửi tin nhắn
    const handleSendMessage = async (messageContent) => {
        // Đảm bảo tin nhắn không trống
        const messageText = typeof messageContent === 'string' ? messageContent.trim() : '';
        
        console.log('Kiểm tra tin nhắn trước khi gửi:', { 
            messageText,
            hasConversation: !!conversation, 
            isLoggedIn: !!currentUser && !!token 
        });

        if (!messageText) {
            console.log('Không thể gửi tin nhắn vì tin nhắn trống');
            return;
        }
        
        if (!conversation || !currentUser || !token) {
            console.log('Không thể gửi tin nhắn:', { 
                hasMessage: !!messageText, 
                hasConversation: !!conversation, 
                isLoggedIn: !!currentUser && !!token 
            });
            return;
        }

        try {
            console.log('Bắt đầu gửi tin nhắn:', messageText);
            console.log('Thông tin cuộc hội thoại:', conversation);
            
            // Đơn giản hóa dữ liệu gửi đi, để backend xác định senderId và senderName từ token
            const messageData = {
                conversationId: conversation._id,
                text: messageText,
                isAdmin: false
            };
            
            console.log('Dữ liệu tin nhắn sẽ gửi:', messageData);
            
            // Thêm tin nhắn tạm thời vào UI
            const tempMessage = {
                ...messageData,
                senderId: currentUser._id,
                senderName: currentUser.name,
                _id: Date.now().toString(),
                createdAt: new Date()
            };
            
            console.log('Tin nhắn tạm thời hiển thị:', tempMessage);
            setMessages(prev => [...prev, tempMessage]);
            
            // Gửi tin nhắn lên server với token xác thực
            console.log('Gửi tin nhắn với token:', token);
            const response = await axios.post(`${API_URL}/chat/message`, messageData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Kết quả gửi tin nhắn:', response.data);
            if (!response.data.success) {
                console.error('Server trả về lỗi khi gửi tin nhắn:', response.data);
                showToast({
                    title: "Lỗi",
                    message: response.data.message || "Không thể gửi tin nhắn. Vui lòng thử lại!",
                    type: "error",
                    duration: 3000
                });
            } else {
                console.log('Tin nhắn đã được lưu thành công trên server');
                
                // Tải lại tin nhắn sau khi gửi thành công
                setTimeout(() => {
                    console.log('Tải lại tin nhắn sau khi gửi thành công');
                    fetchMessages(conversation._id);
                }, 500);
            }
        } catch (error) {
            console.error('Lỗi chi tiết khi gửi tin nhắn:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            showToast({
                title: "Lỗi",
                message: `Không thể gửi tin nhắn: ${error.response?.data?.message || error.message}`,
                type: "error",
                duration: 3000
            });
        }
    };
    
    // Xử lý khi click vào nút đăng nhập
    const handleLoginClick = () => {
        setShowChat(false);
        navigate('/login');
    };
    
    // Tự động kiểm tra tin nhắn mới
    useEffect(() => {
        // Không cần tự động refresh, người dùng sẽ sử dụng nút refresh
        // Hủy bỏ phần cài đặt interval kiểm tra tin nhắn tự động
        
        return () => {
            // Không cần dọn dẹp interval vì không cài đặt
        };
    }, [showChat, conversation]);

    // Khi chat box được mở, lấy cuộc hội thoại và tin nhắn
    useEffect(() => {
        if (showChat) {
            if (!conversation && currentUser && token) {
                console.log('Mở chat box, lấy cuộc hội thoại...');
                getOrCreateConversation();
            } else {
                console.log('Chat box đã mở với trạng thái:', { 
                    hasConversation: !!conversation, 
                    isLoggedIn: !!currentUser && !!token 
                });
            }
        }
    }, [showChat, currentUser, token, conversation]);

    // Tạo nút chat cố định tương tự như nút filter
    useEffect(() => {
        // Kiểm tra nếu nên hiển thị chatbox dựa trên trang hiện tại
        const shouldShow = shouldShowChatbox();
        
        if (shouldShow) {
            // Kiểm tra nếu nút chat đã tồn tại
            if (!document.getElementById("fixed-chat-button")) {
                // Tạo nút chat
                const button = document.createElement('button');
                button.id = "fixed-chat-button";
                button.className = cx('chat-toggle');
                
                // Thêm icon và label
                button.innerHTML = `
                    <i class="fas ${showChat ? 'fa-times' : 'fa-comment-dots'}"></i>
                    <span class="${cx('chat-label')}">HỖ TRỢ</span>
                `;
                
                // Gắn sự kiện click
                button.addEventListener('click', toggleChat);
                
                // Thêm vào body
                document.body.appendChild(button);
                
                // Lưu reference
                chatButtonRef.current = button;
            }
            
            // Cập nhật icon khi state thay đổi
            if (chatButtonRef.current) {
                const iconElement = chatButtonRef.current.querySelector('i');
                if (iconElement) {
                    iconElement.className = `fas ${showChat ? 'fa-times' : 'fa-comment-dots'}`;
                }
            }
        } else {
            // Nếu không nên hiển thị, ẩn/xóa nút chat nếu tồn tại
            const chatButton = document.getElementById("fixed-chat-button");
            if (chatButton) {
                chatButton.remove();
                chatButtonRef.current = null;
            }
            
            // Đồng thời ẩn chatbox nếu đang hiển thị
            if (showChat) {
                setShowChat(false);
            }
        }
        
        // Dọn dẹp khi component unmount hoặc thay đổi route
        return () => {
            const chatButton = document.getElementById("fixed-chat-button");
            if (chatButton) {
                chatButton.remove();
            }
        };
    }, [showChat, location.pathname]); // Thêm location.pathname vào dependencies

    // Tạo chat box di động giống filter box
    useEffect(() => {
        if (showChat) {
            // Nếu chat box chưa tồn tại và cần hiển thị
            if (!document.getElementById("floating-chat-box")) {
                // Tạo chat box container
                const chatBox = document.createElement('div');
                chatBox.id = "floating-chat-box";
                chatBox.className = cx('floating-chat-box');
                
                // Log để kiểm tra trạng thái đăng nhập
                console.log('Rendering chat box with user state:', { 
                    currentUser, 
                    token, 
                    isLoggedIn: !!currentUser && !!token,
                    hasConversation: !!conversation,
                    messagesCount: messages.length 
                });
                
                // Tạo nội dung HTML cho chat box
                chatBox.innerHTML = `
                    <div class="${cx('chat-box-header')}">
                        <h3>Hỗ trợ trực tuyến</h3>
                        <div class="${cx('header-actions')}">
                            ${conversation ? 
                                `<button id="refresh-messages-btn" class="${cx('refresh-button')}" title="Làm mới tin nhắn">
                                    <i class="fas fa-sync-alt"></i>
                                </button>` : ''
                            }
                            <button class="${cx('close-chat-btn')}" id="close-chat-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="${cx('chat-box-content')}" id="chat-messages">
                        ${!currentUser || !token ? 
                            `<div class="${cx('login-required')}">
                                <div class="${cx('login-message')}">
                                    <i class="fas fa-user-lock"></i>
                                    <p>Vui lòng đăng nhập để sử dụng tính năng chat</p>
                                    <button id="login-btn" class="${cx('login-button')}">Đăng nhập ngay</button>
                                </div>
                            </div>` 
                        : loading ? 
                            `<div class="${cx('loading-messages')}">Đang tải tin nhắn...</div>`
                        : error ? 
                            `<div class="${cx('error-messages')}">${error}</div>`
                        : messages.length === 0 ? 
                            `<div class="${cx('welcome-message')}">
                                <p>Xin chào! Hãy để lại tin nhắn, chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                            </div>`
                        : messages.map(msg => `
                            <div class="${cx('message', msg.isAdmin ? 'admin-message' : 'user-message')}">
                                <div class="${cx('message-bubble')}">
                                    ${msg.text}
                                </div>
                                <div class="${cx('message-info')}">
                                    <span class="${cx('message-sender')}">${msg.isAdmin ? (msg.senderName || 'Admin') : 'Bạn'}</span>
                                    <span class="${cx('message-time')}">
                                        ${new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="${cx('chat-box-footer')}">
                        ${currentUser && token ? 
                            `<form id="chat-form" class="${cx('chat-form')}">
                                <input
                                    type="text"
                                    placeholder="Nhập tin nhắn..."
                                    id="chat-input"
                                    class="${cx('chat-input')}"
                                    autocomplete="off"
                                />
                                <button 
                                    type="submit" 
                                    class="${cx('send-button')}" 
                                    id="send-message-btn"
                                    ${!conversation ? 'disabled' : ''}
                                >
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </form>`
                        : ''}
                    </div>
                `;
                
                // Thêm vào body
                document.body.appendChild(chatBox);
                
                // Lưu reference
                chatBoxRef.current = chatBox;
                
                // Thêm sự kiện đóng chat - sửa lại cách gắn event
                document.getElementById('close-chat-btn').addEventListener('click', closeChat);
                
                // Thêm sự kiện làm mới tin nhắn
                const refreshBtn = document.getElementById('refresh-messages-btn');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        
                        // Tránh click nhiều lần khi đang làm mới
                        if (loading) {
                            console.log('Đang làm mới tin nhắn, vui lòng đợi...');
                            return;
                        }
                        
                        refreshMessages();
                    });
                }
                
                // Thêm sự kiện đăng nhập
                const loginBtn = chatBox.querySelector('#login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', handleLoginClick);
                }
                
                // Thêm sự kiện cho form gửi tin nhắn (chỉ nếu đã đăng nhập)
                if (currentUser && token && conversation) {
                    const chatForm = chatBox.querySelector('#chat-form');
                    const chatInput = chatBox.querySelector('#chat-input');
                    const sendButton = chatBox.querySelector('#send-message-btn');
                    
                    if (chatForm && chatInput && sendButton) {
                        // Thêm event listener cho form submit
                        chatForm.addEventListener('submit', (e) => {
                            e.preventDefault();
                            
                            // Lấy giá trị trực tiếp từ input, tránh dùng state để tránh bất đồng bộ
                            const message = chatInput.value.trim();
                            
                            if (message) {
                                // Xóa input trước khi gửi
                                chatInput.value = '';
                                
                                // Gửi tin nhắn trực tiếp, không thông qua state
                                handleSendMessage(message);
                                
                                // Focus lại vào input
                                chatInput.focus();
                            }
                        });
                        
                        // Thêm sự kiện nhấn phím Enter để gửi tin nhắn
                        chatInput.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (chatInput.value.trim()) {
                                    chatForm.dispatchEvent(new Event('submit'));
                                }
                            }
                        });
                        
                        // Focus vào input
                        chatInput.focus();
                    }
                }
                
                // Thêm sự kiện drag & drop cho chat box
                let isDragging = false;
                let offsetX, offsetY;
                
                const chatHeader = chatBox.querySelector(`.${cx('chat-box-header')}`);
                if (chatHeader) {
                    chatHeader.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        offsetX = e.clientX - chatBox.getBoundingClientRect().left;
                        offsetY = e.clientY - chatBox.getBoundingClientRect().top;
                        chatBox.style.cursor = 'grabbing';
                    });
                    
                    document.addEventListener('mousemove', (e) => {
                        if (isDragging) {
                            const x = e.clientX - offsetX;
                            const y = e.clientY - offsetY;
                            
                            // Giới hạn trong viewport
                            const maxX = window.innerWidth - chatBox.offsetWidth;
                            const maxY = window.innerHeight - chatBox.offsetHeight;
                            
                            chatBox.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                            chatBox.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
                        }
                    });
                    
                    document.addEventListener('mouseup', () => {
                        isDragging = false;
                        if (chatBox) {
                            chatBox.style.cursor = 'auto';
                        }
                    });
                    
                    // Touch events cho mobile
                    chatHeader.addEventListener('touchstart', (e) => {
                        isDragging = true;
                        offsetX = e.touches[0].clientX - chatBox.getBoundingClientRect().left;
                        offsetY = e.touches[0].clientY - chatBox.getBoundingClientRect().top;
                    });
                    
                    document.addEventListener('touchmove', (e) => {
                        if (isDragging) {
                            const x = e.touches[0].clientX - offsetX;
                            const y = e.touches[0].clientY - offsetY;
                            
                            // Giới hạn trong viewport
                            const maxX = window.innerWidth - chatBox.offsetWidth;
                            const maxY = window.innerHeight - chatBox.offsetHeight;
                            
                            chatBox.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                            chatBox.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
                        }
                    });
                    
                    document.addEventListener('touchend', () => {
                        isDragging = false;
                    });
                }
            }
            
            // Cập nhật tin nhắn khi có thay đổi
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    ${!currentUser || !token ? 
                        `<div class="${cx('login-required')}">
                            <div class="${cx('login-message')}">
                                <i class="fas fa-user-lock"></i>
                                <p>Vui lòng đăng nhập để sử dụng tính năng chat</p>
                                <button id="login-btn" class="${cx('login-button')}">Đăng nhập ngay</button>
                            </div>
                        </div>` 
                    : loading ? 
                        `<div class="${cx('loading-messages')}">Đang tải tin nhắn...</div>`
                    : error ? 
                        `<div class="${cx('error-messages')}">${error}</div>`
                    : messages.length === 0 ? 
                        `<div class="${cx('welcome-message')}">
                            <p>Xin chào! Hãy để lại tin nhắn, chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                        </div>`
                    : messages.map(msg => `
                        <div class="${cx('message', msg.isAdmin ? 'admin-message' : 'user-message')}">
                            <div class="${cx('message-bubble')}">
                                ${msg.text}
                            </div>
                            <div class="${cx('message-info')}">
                                <span class="${cx('message-sender')}">${msg.isAdmin ? (msg.senderName || 'Admin') : 'Bạn'}</span>
                                <span class="${cx('message-time')}">
                                    ${new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                `;
                
                // Cuộn xuống tin nhắn mới nhất
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // Thêm lại sự kiện đăng nhập nếu nút tồn tại
                const loginBtn = messagesContainer.querySelector('#login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', handleLoginClick);
                }
            }
            
            // Cập nhật footer chat box khi thay đổi trạng thái đăng nhập
            const chatBoxFooter = document.querySelector(`.${cx('chat-box-footer')}`);
            if (chatBoxFooter) {
                chatBoxFooter.innerHTML = `
                    ${currentUser && token ? 
                        `<form id="chat-form" class="${cx('chat-form')}">
                            <input
                                type="text"
                                placeholder="Nhập tin nhắn..."
                                id="chat-input"
                                class="${cx('chat-input')}"
                                autocomplete="off"
                            />
                            <button 
                                type="submit" 
                                class="${cx('send-button')}" 
                                id="send-message-btn"
                                ${!conversation ? 'disabled' : ''}
                            >
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </form>`
                    : ''}
                `;
                
                // Thêm lại sự kiện gửi tin nhắn nếu form tồn tại và đã đăng nhập
                if (currentUser && token && conversation) {
                    const chatForm = chatBoxFooter.querySelector('#chat-form');
                    const chatInput = chatBoxFooter.querySelector('#chat-input');
                    const sendButton = chatBoxFooter.querySelector('#send-message-btn');
                    
                    if (chatForm && chatInput && sendButton) {
                        // Thêm event listener cho form submit
                        chatForm.addEventListener('submit', (e) => {
                            e.preventDefault();
                            
                            // Lấy giá trị trực tiếp từ input, tránh dùng state để tránh bất đồng bộ
                            const message = chatInput.value.trim();
                            
                            if (message) {
                                // Xóa input trước khi gửi
                                chatInput.value = '';
                                
                                // Gửi tin nhắn trực tiếp, không thông qua state
                                handleSendMessage(message);
                                
                                // Focus lại vào input
                                chatInput.focus();
                            }
                        });
                        
                        // Thêm sự kiện nhấn phím Enter để gửi tin nhắn
                        chatInput.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (chatInput.value.trim()) {
                                    chatForm.dispatchEvent(new Event('submit'));
                                }
                            }
                        });
                        
                        // Focus vào input
                        chatInput.focus();
                    }
                }
            }
        } else {
            // Nếu cần ẩn chat box
            const chatBox = document.getElementById("floating-chat-box");
            if (chatBox) {
                chatBox.remove();
                chatBoxRef.current = null;
            }
        }
    }, [showChat, messages, loading, error, newMessage, currentUser, token, conversation]); // Thêm conversation vào dependencies

    return null; // Component không render gì vì tất cả đều được thêm động vào DOM
};

export default ChatBox;