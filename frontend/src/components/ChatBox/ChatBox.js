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

    useEffect(() => {
        console.log('Auth state:', { isLoggedIn: !!currentUser, currentUser, token });
    }, [currentUser, token]);

    const shouldShowChatbox = () => {
        // Không hiển thị widget chat hỗ trợ khách hàng cho tài khoản Admin
        if (currentUser && currentUser.role === 'admin') return false;
        if (!location || !location.pathname) return true;

        const path = location.pathname;
        return !path.includes('/login') && !path.includes('/register') &&
               !path.includes('/admin') && !path.includes('/info');
    };

    const [guestId, setGuestId] = useState(() => {
        const savedGuestId = localStorage.getItem('guest_chat_id');
        return savedGuestId || null;
    });

    const toggleChat = () => {
        setShowChat(prev => !prev);

        if (showChat) {
            const chatBox = document.getElementById("floating-chat-box");
            if (chatBox) {
                chatBox.remove();
                chatBoxRef.current = null;
            }
        }
    };

    const closeChat = () => {
        setShowChat(false);
        const chatBox = document.getElementById("floating-chat-box");
        if (chatBox) {
            chatBox.remove();
            chatBoxRef.current = null;
        }
    };

    const getOrCreateConversation = async () => {
        try {
            if (!currentUser || !token) {
                console.log('Không thể lấy cuộc hội thoại: Người dùng chưa đăng nhập');
                return;
            }
            
            setLoading(true);
            
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
                
                await fetchMessages(response.data.conversation._id);
                
                if (isNewConversation && messages.length === 0) {
                    console.log('Cuộc hội thoại mới, hiển thị tin nhắn chào mừng');
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

    const scrollToBottom = () => {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    const refreshMessages = () => {
        if (!conversation) {
            console.log('Không thể làm mới: Không có cuộc trò chuyện');
            return;
        }
        
        setLoading(true);
        
        const refreshBtn = document.getElementById('refresh-messages-btn');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
            }
        }
        
        fetchMessages(conversation._id)
            .then(() => {
                console.log('Đã làm mới tin nhắn');
                scrollToBottom();
            })
            .catch(err => {
                console.error('Lỗi khi làm mới tin nhắn:', err);
            })
            .finally(() => {
                if (refreshBtn) {
                    const icon = refreshBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-spin');
                    }
                }
            });
    };

    const handleSendMessage = async (messageContent) => {
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
            
            const messageData = {
                conversationId: conversation._id,
                text: messageText,
                isAdmin: false
            };
            
            console.log('Dữ liệu tin nhắn sẽ gửi:', messageData);
            
            const tempMessage = {
                ...messageData,
                senderId: currentUser._id,
                senderName: currentUser.name,
                _id: Date.now().toString(),
                createdAt: new Date()
            };
            
            console.log('Tin nhắn tạm thời hiển thị:', tempMessage);
            setMessages(prev => [...prev, tempMessage]);
            
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
    
    const handleLoginClick = () => {
        setShowChat(false);
        navigate('/login');
    };
    
    useEffect(() => {
        
        return () => {
        };
    }, [showChat, conversation]);

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

    useEffect(() => {
        const shouldShow = shouldShowChatbox();
        
        if (shouldShow) {
            if (!document.getElementById("fixed-chat-button")) {
                const button = document.createElement('button');
                button.id = "fixed-chat-button";
                button.className = cx('chat-toggle');
                
                button.innerHTML = `
                    <i class="fas ${showChat ? 'fa-times' : 'fa-comment-dots'}"></i>
                    <span class="${cx('chat-label')}">HỖ TRỢ</span>
                `;
                
                button.addEventListener('click', toggleChat);
                
                document.body.appendChild(button);
                
                chatButtonRef.current = button;
            }
            
            if (chatButtonRef.current) {
                const iconElement = chatButtonRef.current.querySelector('i');
                if (iconElement) {
                    iconElement.className = `fas ${showChat ? 'fa-times' : 'fa-comment-dots'}`;
                }
            }
        } else {
            const chatButton = document.getElementById("fixed-chat-button");
            if (chatButton) {
                chatButton.remove();
                chatButtonRef.current = null;
            }
            
            if (showChat) {
                setShowChat(false);
            }
        }
        
        return () => {
            const chatButton = document.getElementById("fixed-chat-button");
            if (chatButton) {
                chatButton.remove();
            }
        };
    }, [showChat, location.pathname]);

    useEffect(() => {
        if (showChat) {
            if (!document.getElementById("floating-chat-box")) {
                const chatBox = document.createElement('div');
                chatBox.id = "floating-chat-box";
                chatBox.className = cx('floating-chat-box');
                
                console.log('Rendering chat box with user state:', { 
                    currentUser, 
                    token, 
                    isLoggedIn: !!currentUser && !!token,
                    hasConversation: !!conversation,
                    messagesCount: messages.length 
                });
                
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
                
                document.body.appendChild(chatBox);
                
                chatBoxRef.current = chatBox;
                
                document.getElementById('close-chat-btn').addEventListener('click', closeChat);
                
                const refreshBtn = document.getElementById('refresh-messages-btn');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        
                        if (loading) {
                            console.log('Đang làm mới tin nhắn, vui lòng đợi...');
                            return;
                        }
                        
                        refreshMessages();
                    });
                }
                
                const loginBtn = chatBox.querySelector('#login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', handleLoginClick);
                }
                
                if (currentUser && token && conversation) {
                    const chatForm = chatBox.querySelector('#chat-form');
                    const chatInput = chatBox.querySelector('#chat-input');
                    const sendButton = chatBox.querySelector('#send-message-btn');
                    
                    if (chatForm && chatInput && sendButton) {
                        chatForm.addEventListener('submit', (e) => {
                            e.preventDefault();
                            
                            const message = chatInput.value.trim();
                            
                            if (message) {
                                chatInput.value = '';
                                
                                handleSendMessage(message);
                                
                                chatInput.focus();
                            }
                        });
                        
                        chatInput.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (chatInput.value.trim()) {
                                    chatForm.dispatchEvent(new Event('submit'));
                                }
                            }
                        });
                        
                        chatInput.focus();
                    }
                }
                
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
                    
                    chatHeader.addEventListener('touchstart', (e) => {
                        isDragging = true;
                        offsetX = e.touches[0].clientX - chatBox.getBoundingClientRect().left;
                        offsetY = e.touches[0].clientY - chatBox.getBoundingClientRect().top;
                    });
                    
                    document.addEventListener('touchmove', (e) => {
                        if (isDragging) {
                            const x = e.touches[0].clientX - offsetX;
                            const y = e.touches[0].clientY - offsetY;
                            
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
                
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                const loginBtn = messagesContainer.querySelector('#login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', handleLoginClick);
                }
            }
            
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
                
                if (currentUser && token && conversation) {
                    const chatForm = chatBoxFooter.querySelector('#chat-form');
                    const chatInput = chatBoxFooter.querySelector('#chat-input');
                    const sendButton = chatBoxFooter.querySelector('#send-message-btn');
                    
                    if (chatForm && chatInput && sendButton) {
                        chatForm.addEventListener('submit', (e) => {
                            e.preventDefault();
                            
                            const message = chatInput.value.trim();
                            
                            if (message) {
                                chatInput.value = '';
                                
                                handleSendMessage(message);
                                
                                chatInput.focus();
                            }
                        });
                        
                        chatInput.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (chatInput.value.trim()) {
                                    chatForm.dispatchEvent(new Event('submit'));
                                }
                            }
                        });
                        
                        chatInput.focus();
                    }
                }
            }
        } else {
            const chatBox = document.getElementById("floating-chat-box");
            if (chatBox) {
                chatBox.remove();
                chatBoxRef.current = null;
            }
        }
    }, [showChat, messages, loading, error, newMessage, currentUser, token, conversation]);

    return null;
};

export default ChatBox;