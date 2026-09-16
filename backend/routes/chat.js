const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.get('/conversation', isAuthenticatedUser, async (req, res) => {
    try {
        const userId = req.user._id;
        
        let conversation = await Conversation.findOne({ userId });
        
        if (!conversation) {
            conversation = new Conversation({
                userId,
                userName: req.user.name || 'Khách hàng',
                userEmail: req.user.email || ''
            });
            await conversation.save();
        }
        
        res.status(200).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('Lỗi khi lấy cuộc hội thoại:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy cuộc hội thoại'
        });
    }
});

router.post('/conversation/guest', async (req, res) => {
    try {
        const guestId = req.body.guestId || `guest_${Date.now()}`;
        const guestName = req.body.guestName || 'Khách';
        
        let conversation = await Conversation.findOne({ userId: guestId });
        
        if (!conversation) {
            conversation = new Conversation({
                userId: guestId,
                userName: guestName
            });
            await conversation.save();
        }
        
        res.status(200).json({
            success: true,
            conversation,
            guestId
        });
    } catch (error) {
        console.error('Lỗi khi tạo cuộc hội thoại cho khách:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi tạo cuộc hội thoại'
        });
    }
});

router.post('/message', isAuthenticatedUser, async (req, res) => {
    try {
        const { conversationId, text, isAdmin = false } = req.body;
        
        const userId = req.user._id;
        const userName = req.user.name || 'Người dùng';
        const userRole = req.user.role || [];
        
        console.log('Thông tin người dùng gửi tin nhắn:', { userId, userName, userRole, isAdmin });
        
        if (isAdmin && !userRole.includes('admin')) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền gửi tin nhắn với tư cách admin'
            });
        }
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            console.log('Không tìm thấy cuộc hội thoại:', conversationId);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc hội thoại'
            });
        }
        
        console.log('Thông tin cuộc hội thoại:', conversation);
        
        if (!isAdmin && conversation.userId.toString() !== userId.toString()) {
            console.log('Người dùng không có quyền gửi tin nhắn trong cuộc hội thoại này');
            return res.status(403).json({
                success: false,
                message: 'Không có quyền gửi tin nhắn trong cuộc hội thoại này'
            });
        }
        
        const message = new Message({
            conversationId,
            senderId: userId,
            senderName: userName,
            text,
            isAdmin
        });
        
        console.log('Tin nhắn sẽ lưu:', message);
        await message.save();
        console.log('Đã lưu tin nhắn thành công');
        
        conversation.lastMessage = text;
        conversation.lastUpdated = Date.now();
        
        if (!isAdmin) {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }
        
        await conversation.save();
        console.log('Đã cập nhật cuộc hội thoại');
        
        res.status(201).json({
            success: true,
            message: message
        });
    } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi gửi tin nhắn',
            error: error.message
        });
    }
});

router.get('/messages/:conversationId', isAuthenticatedUser, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role || [];
        
        console.log('Lấy tin nhắn cho cuộc hội thoại:', conversationId);
        console.log('Thông tin người dùng:', { userId, userRole });
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            console.log('Không tìm thấy cuộc hội thoại:', conversationId);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc hội thoại'
            });
        }
        
        const isAdmin = userRole.includes('admin');
        if (!isAdmin && conversation.userId.toString() !== userId.toString()) {
            console.log('Người dùng không có quyền xem tin nhắn trong cuộc hội thoại này');
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem tin nhắn trong cuộc hội thoại này'
            });
        }
        
        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 });
        
        console.log(`Tìm thấy ${messages.length} tin nhắn`);
        
        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách tin nhắn:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách tin nhắn',
            error: error.message
        });
    }
});

router.get('/conversations', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .sort({ lastUpdated: -1 });
        
        res.status(200).json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách cuộc hội thoại:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách cuộc hội thoại'
        });
    }
});

router.put('/conversation/:conversationId/read', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc hội thoại'
            });
        }
        
        conversation.unreadCount = 0;
        await conversation.save();
        
        await Message.updateMany(
            { conversationId, isAdmin: false, isRead: false },
            { isRead: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Đánh dấu tin nhắn đã đọc thành công'
        });
    } catch (error) {
        console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đánh dấu tin nhắn đã đọc'
        });
    }
});

router.delete('/conversation/:conversationId', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
    try {
        const { conversationId } = req.params;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc hội thoại'
            });
        }
        
        await Message.deleteMany({ conversationId });
        
        await Conversation.findByIdAndDelete(conversationId);
        
        res.status(200).json({
            success: true,
            message: 'Đã xóa cuộc hội thoại và tin nhắn liên quan thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa cuộc hội thoại:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa cuộc hội thoại',
            error: error.message
        });
    }
});

module.exports = router; 