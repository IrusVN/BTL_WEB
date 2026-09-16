const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate({
                path: 'items.product',
                select: 'name images price stock'
            });

        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: [],
                totalAmount: 0
            });
            
            cart = await Cart.findById(cart._id).populate({
                path: 'items.product',
                select: 'name images price stock'
            });
        }

        res.status(200).json({
            success: true,
            cart
        });
    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy giỏ hàng',
            error: error.message
        });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }


        let cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: [{
                    product: productId,
                    quantity,
                    price: product.price
                }]
            });
        } else {
            const existingItemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );

            if (existingItemIndex !== -1) {
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                cart.items.push({
                    product: productId,
                    quantity,
                    price: product.price
                });
            }

            await cart.save();
        }

        cart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name images price stock'
        });

        res.status(200).json({
            success: true,
            message: 'Đã thêm sản phẩm vào giỏ hàng',
            cart
        });
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm sản phẩm vào giỏ hàng',
            error: error.message
        });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giỏ hàng'
            });
        }
        
        const cartItem = cart.items.id(itemId);
        
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }
        
        const product = await Product.findById(cartItem.product);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng sản phẩm trong kho không đủ'
            });
        }
        
        cartItem.quantity = quantity;
        
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name images price stock'
        });
        
        res.status(200).json({
            success: true,
            message: 'Đã cập nhật giỏ hàng',
            cart: updatedCart
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật giỏ hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật giỏ hàng',
            error: error.message
        });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giỏ hàng'
            });
        }
        
        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }
        
        cart.items.splice(itemIndex, 1);
        
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items.product',
            select: 'name images price stock'
        });
        
        res.status(200).json({
            success: true,
            message: 'Đã xóa sản phẩm khỏi giỏ hàng',
            cart: updatedCart
        });
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng',
            error: error.message
        });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giỏ hàng'
            });
        }
        
        cart.items = [];
        
        await cart.save();
        
        res.status(200).json({
            success: true,
            message: 'Đã xóa toàn bộ giỏ hàng',
            cart
        });
    } catch (error) {
        console.error('Lỗi khi xóa giỏ hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa giỏ hàng',
            error: error.message
        });
    }
};

exports.createOrderFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const cart = await Cart.findOne({ user: userId }).populate({
            path: 'items.product',
            select: 'name images price stock'
        });
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Giỏ hàng trống không thể tạo đơn hàng'
            });
        }
        
        const { 
            fullName,
            address, 
            city, 
            postalCode, 
            country, 
            phoneNo,
            paymentMethod,
            note
        } = req.body;
        
        if (!fullName || !address || !city || !phoneNo) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng'
            });
        }
        
        const stockCheckResults = [];
        let hasInsufficientStock = false;
        
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);
            
            if (!product) {
                stockCheckResults.push({
                    product: item.product.name,
                    status: 'error',
                    message: 'Sản phẩm không tồn tại'
                });
                hasInsufficientStock = true;
                continue;
            }
            
            if (product.stock < item.quantity) {
                stockCheckResults.push({
                    product: item.product.name,
                    status: 'error',
                    message: `Số lượng tồn kho không đủ. Chỉ còn ${product.stock} sản phẩm.`,
                    currentStock: product.stock,
                    requestedQuantity: item.quantity
                });
                hasInsufficientStock = true;
            } else {
                stockCheckResults.push({
                    product: item.product.name,
                    status: 'success',
                    message: 'Đủ số lượng'
                });
            }
        }
        
        if (hasInsufficientStock) {
            return res.status(400).json({
                success: false,
                message: 'Một số sản phẩm không có đủ số lượng trong kho',
                stockCheckResults
            });
        }
        
        const orderItems = cart.items.map(item => {
            return {
                name: item.product.name,
                quantity: item.quantity,
                image: item.product.images[0]?.url || '',
                price: item.price,
                product: item.product._id
            };
        });
        
        const itemsPrice = cart.totalAmount;
        const shippingPrice = 0;
        const taxPrice = Math.round(itemsPrice * 0.1);
        const totalPrice = itemsPrice + shippingPrice + taxPrice;
        
        const Order = require('../models/Order');
        const order = await Order.create({
            shippingInfo: {
                fullName,
                address,
                city,
                phoneNo,
                postalCode: postalCode || '',
                country: country || 'Việt Nam'
            },
            user: userId,
            orderItems,
            paymentInfo: {
                id: `COD_${Date.now()}`,
                status: 'Chưa thanh toán',
                method: paymentMethod || 'COD'
            },
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            note: note || '',
            orderStatus: 'Processing',
            paidAt: paymentMethod === 'COD' ? null : Date.now()
        });
        
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);
            product.stock -= item.quantity;
            await product.save({ validateBeforeSave: false });
        }
        
        cart.items = [];
        await cart.save();
        
        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công',
            order
        });
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng',
            error: error.message
        });
    }
}; 