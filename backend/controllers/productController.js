const Product = require('../models/Product');
const { uploadToR2 } = require('../services/r2Service');

exports.createProduct = async (req, res) => {
    try {
        console.log('Creating product...');
        console.log('Headers:', req.headers);
        console.log('Cookies:', req.cookies);
        console.log('User:', req.user);
        console.log('Request body:', req.body);
        
        if (!req.body.seller && req.user) {
            req.body.seller = req.user.id;
        } else if (!req.body.seller) {
            req.body.seller = "unknown";
        }
        
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

exports.getProducts = async (req, res) => {
    try {
        const { brand, limit } = req.query;

        const filter = {};
        if (brand) {
            const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.brand = new RegExp(`^\\s*${escapedBrand}\\s*$`, 'i');
        }

        let query = Product.find(filter).lean();

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


const SUGGEST_LIMIT = 5;
const SUGGEST_TTL = 5 * 60 * 1000;
let suggestLightCache = null;
let suggestLightCacheAt = 0;
const suggestThumbCache = new Map();

async function getSuggestLightProducts() {
    if (suggestLightCache && Date.now() - suggestLightCacheAt < SUGGEST_TTL) {
        return suggestLightCache;
    }
    const products = await Product.find({}, 'name description price').lean();
    suggestLightCache = products;
    suggestLightCacheAt = Date.now();
    suggestThumbCache.clear();
    return products;
}

async function hydrateThumbs(ids) {
    const missing = ids.filter((id) => !suggestThumbCache.has(String(id)));
    if (missing.length === 0) return;

    const rows = await Product.aggregate([
        { $match: { _id: { $in: missing } } },
        { $project: { thumb: { $arrayElemAt: ['$images', 0] } } }
    ]);
    rows.forEach((row) => {
        suggestThumbCache.set(String(row._id), (row.thumb && row.thumb.url) || null);
    });
}

exports.getProductSuggestions = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim().toLowerCase().slice(0, 100);
        if (q.length < 2) {
            return res.status(200).json({ success: true, count: 0, suggestions: [] });
        }

        const words = q.split(/\s+/).filter(Boolean);
        const scored = (await getSuggestLightProducts())
            .map((product) => {
                const name = product.name ? product.name.toLowerCase() : '';
                const description = product.description ? product.description.toLowerCase() : '';
                let score = 0;
                words.forEach((word) => {
                    if (name.includes(word)) score += 2;
                    else if (description.includes(word)) score += 1;
                });
                return { product, score };
            })
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, SUGGEST_LIMIT);

        if (scored.length === 0) {
            return res.status(200).json({ success: true, count: 0, suggestions: [] });
        }

        await hydrateThumbs(scored.map((entry) => entry.product._id));

        const suggestions = scored.map((entry) => ({
            _id: entry.product._id,
            name: entry.product.name,
            price: entry.product.price,
            thumb: suggestThumbCache.get(String(entry.product._id)) || null
        }));

        res.status(200).json({
            success: true,
            count: suggestions.length,
            suggestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

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

exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

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

        if (req.body.images && req.body.images.length > 0) {
            productData.images = req.body.images;
        }

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

exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
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

exports.uploadProductImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ít nhất một hình ảnh'
            });
        }

        const uploadPromises = req.files.map(file =>
            uploadToR2({
                buffer: file.buffer,
                mimeType: file.mimetype,
                originalName: file.originalname,
                folder: 'products'
            })
        );

        const urls = await Promise.all(uploadPromises);

        res.status(200).json({
            success: true,
            images: urls.map(url => ({ url }))
        });
    } catch (error) {
        console.error('Lỗi khi tải ảnh lên R2:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tải ảnh lên Cloudflare R2'
        });
    }
};

function parseBase64Image(dataString) {
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        const mimeType = matches[1];
        let ext = 'jpg';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('gif')) ext = 'gif';
        return {
            mimeType,
            ext,
            buffer: Buffer.from(matches[2], 'base64')
        };
    }
    return {
        mimeType: 'image/jpeg',
        ext: 'jpg',
        buffer: Buffer.from(dataString, 'base64')
    };
}

exports.cleanBase64Images = async (req, res) => {
    try {
        const products = await Product.find({});
        let updatedCount = 0;
        let imageCount = 0;

        for (const product of products) {
            let hasBase64 = false;
            if (product.images && product.images.length > 0) {
                const newImages = [];
                for (let i = 0; i < product.images.length; i++) {
                    const img = product.images[i];
                    if (img.url && (img.url.startsWith('data:image/') || img.url.length > 1000)) {
                        hasBase64 = true;
                        try {
                            const parsed = parseBase64Image(img.url);
                            const r2Url = await uploadToR2({
                                buffer: parsed.buffer,
                                mimeType: parsed.mimeType,
                                originalName: `${product.code || 'product'}-${i}-${Date.now()}.${parsed.ext}`,
                                folder: 'products'
                            });
                            newImages.push({ url: r2Url });
                            imageCount++;
                        } catch (uploadErr) {
                            console.error(`Lỗi khi chuyển ảnh ${i} của sản phẩm ${product.name} lên R2:`, uploadErr);
                            newImages.push(img);
                        }
                    } else {
                        newImages.push(img);
                    }
                }

                if (hasBase64) {
                    product.images = newImages;
                    await product.save({ validateBeforeSave: false });
                    updatedCount++;
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Đã chuyển đổi thành công ${imageCount} ảnh của ${updatedCount} sản phẩm lên Cloudflare R2 mà không mất ảnh!`,
            updatedCount,
            imageCount
        });
    } catch (error) {
        console.error('Lỗi khi chuyển đổi ảnh Base64 lên R2:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 