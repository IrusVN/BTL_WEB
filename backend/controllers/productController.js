const Product = require('../models/Product');

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        console.log('Creating product...');
        console.log('Headers:', req.headers);
        console.log('Cookies:', req.cookies);
        console.log('User:', req.user);
        console.log('Request body:', req.body);
        
        // Đảm bảo rằng có seller
        if (!req.body.seller && req.user) {
            req.body.seller = req.user.id;
        } else if (!req.body.seller) {
            req.body.seller = "unknown"; // Giá trị mặc định nếu không có seller
        }
        
        // Tạo mã code ngẫu nhiên nếu không có
        if (!req.body.code || req.body.code === '') {
            req.body.code = 'PROD-' + Math.floor(Math.random() * 1000000).toString();
        }
        
        try {
            const product = await Product.create(req.body);
            console.log('Product created successfully:', product);
            
            res.status(201).json({
                success: true,
                product
            });
        } catch (err) {
            // Nếu lỗi trùng lặp code, thử lại với code khác
            if (err.code === 11000 && err.keyPattern && err.keyPattern.code) {
                req.body.code = 'PROD-' + Math.floor(Math.random() * 1000000).toString();
                const product = await Product.create(req.body);
                console.log('Product created with new code:', product);
                
                res.status(201).json({
                    success: true,
                    product
                });
            } else {
                throw err;
            }
        }
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy tất cả sản phẩm (hỗ trợ lọc theo brand và giới hạn số lượng qua query params)
exports.getProducts = async (req, res) => {
    try {
        const { brand, limit } = req.query;

        const filter = {};
        if (brand) {
            // Escape ký tự đặc biệt để tránh regex injection
            const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.brand = new RegExp(`^\\s*${escapedBrand}\\s*$`, 'i');
        }

        let query = Product.find(filter);

        const parsedLimit = parseInt(limit, 10);
        if (parsedLimit > 0) {
            query = query.limit(parsedLimit);
        }

        const products = await query;

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Lấy chi tiết sản phẩm
exports.getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Xử lý dữ liệu sản phẩm
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            stock: req.body.stock,
            category: req.body.category,
            brand: req.body.brand,
            gioiTinh: req.body.gioiTinh,
            mauSac: req.body.mauSac,
            kieuDang: req.body.kieuDang,
            chatLieu: req.body.chatLieu,
            xuatXu: req.body.xuatXu,
            size: req.body.size
        };

        // Xử lý hình ảnh nếu có hình ảnh mới được gửi lên
        if (req.body.images && req.body.images.length > 0) {
            productData.images = req.body.images;
        }

        // Cập nhật sản phẩm
        product = await Product.findByIdAndUpdate(req.params.id, productData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Lỗi cập nhật sản phẩm:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Sản phẩm đã được xóa'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Tạo/Cập nhật đánh giá
exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment, productId } = req.body;

        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment
        };

        const product = await Product.findById(productId);

        const isReviewed = product.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        );

        if (isReviewed) {
            product.reviews.forEach(review => {
                if (review.user.toString() === req.user._id.toString()) {
                    review.comment = comment;
                    review.rating = rating;
                }
            });
        } else {
            product.reviews.push(review);
            product.numOfReviews = product.reviews.length;
        }

        product.ratings =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

        await product.save({ validateBeforeSave: false });

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

// Lấy sản phẩm theo danh mục
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        // Truy vấn sản phẩm theo danh mục
        const products = await Product.find({ category: categoryId });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm theo danh mục:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 