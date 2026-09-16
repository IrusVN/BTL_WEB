const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên sản phẩm'],
        trim: true,
        maxLength: [100, 'Tên sản phẩm không được vượt quá 100 ký tự']
    },
    price: {
        type: Number,
        required: [true, 'Vui lòng nhập giá sản phẩm'],
        maxLength: [12, 'Giá sản phẩm không được vượt quá 12 chữ số'],
        default: 0.0
    },
    description: {
        type: String,
        required: [true, 'Vui lòng nhập mô tả sản phẩm']
    },
    ratings: {
        type: Number,
        default: 0
    },
    images: [
        {
            url: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: String,
        required: [true, 'Vui lòng chọn danh mục sản phẩm']
    },
    seller: {
        type: String,
        required: [true, 'Vui lòng nhập người bán']
    },
    stock: {
        type: Number,
        required: [true, 'Vui lòng nhập số lượng tồn kho'],
        maxLength: [5, 'Số lượng tồn kho không được vượt quá 5 chữ số'],
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    brand: {
        type: String,
        default: ''
    },
    xuatXu: {
        type: String,
        default: ''
    },
    gioiTinh: {
        type: String,
        default: ''
    },
    mauSac: {
        type: String,
        default: ''
    },
    kieuDang: {
        type: String,
        default: ''
    },
    chatLieu: {
        type: String,
        default: ''
    },
    size: {
        type: String,
        default: ''
    },
    code: {
        type: String,
        default: function() {
            return 'PROD-' + Math.floor(Math.random() * 1000000).toString();
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema); 