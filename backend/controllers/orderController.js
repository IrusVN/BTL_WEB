const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../services/emailService');

exports.newOrder = async (req, res) => {
    try {
        const {
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo
        } = req.body;

        const order = await Order.create({
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo,
            paidAt: Date.now(),
            user: req.user._id
        });

        const user = await User.findById(req.user._id);
        
        if (user && user.email) {
            try {
                await sendOrderConfirmationEmail(order, user.email);
            } catch (emailError) {
                console.error('Lỗi khi gửi email xác nhận:', emailError);
            }
        }

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getSingleOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate(
            'user',
            'name email'
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.myOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });

        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find();

        let totalAmount = 0;
        orders.forEach(order => {
            totalAmount += order.totalPrice;
        });

        res.status(200).json({
            success: true,
            totalAmount,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        if (order.orderStatus === 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được giao'
            });
        }

        order.orderItems.forEach(async item => {
            await updateStock(item.product, item.quantity);
        });

        order.orderStatus = req.body.status;
        
        if (req.body.status === 'Delivered') {
            order.deliveredAt = Date.now();
        }

        await order.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.resendOrderConfirmationEmail = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này'
            });
        }
        
        const user = await User.findById(order.user);
        
        if (!user || !user.email) {
            return res.status(400).json({
                success: false,
                message: 'Không thể tìm thấy email của người dùng'
            });
        }

        if (!process.env.EMAIL) {
            return res.status(500).json({
                success: false,
                message: 'Chức năng gửi email chưa được cấu hình. Vui lòng liên hệ admin.'
            });
        }
        
        const emailSent = await sendOrderConfirmationEmail(order, user.email);
        
        if (emailSent) {
            res.status(200).json({
                success: true,
                message: 'Email xác nhận đơn hàng đã được gửi thành công'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Không thể gửi email xác nhận. Vui lòng kiểm tra cấu hình email hoặc thử lại sau.'
            });
        }
    } catch (error) {
        console.error('Lỗi resendOrderConfirmationEmail:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi gửi email xác nhận'
        });
    }
};

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    product.stock = product.stock - quantity;
    await product.save({ validateBeforeSave: false });
}

exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        await order.remove();

        res.status(200).json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền hủy đơn hàng này'
            });
        }
        
        if (order.orderStatus !== 'Processing') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy đơn hàng này vì đã được xử lý'
            });
        }

        order.orderStatus = 'Cancelled';

        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save({ validateBeforeSave: false });
            }
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Đơn hàng đã được hủy thành công và số lượng sản phẩm đã được cập nhật lại trong kho'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.removeOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }
        
        if (order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered') {
            for (const item of order.orderItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save({ validateBeforeSave: false });
                }
            }
        }

        await Order.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Đơn hàng đã được xóa hoàn toàn'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 