const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
        }
    }
});

const {
    getProducts,
    createProduct,
    getProductDetails,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductsByCategory,
    getProductSuggestions,
    uploadProductImages,
    cleanBase64Images
} = require('../controllers/productController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.route('/products').get(getProducts);

router.route('/suggest').get(getProductSuggestions);

router.route('/category/:categoryId').get(getProductsByCategory);

router.route('/upload-images').post(isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), uploadProductImages);

router.route('/admin/clean-base64').post(isAuthenticatedUser, authorizeRoles('admin'), cleanBase64Images);

router.route('/product/new').post(isAuthenticatedUser, authorizeRoles('admin'), createProduct);

router.route('/product/:id')
    .get(getProductDetails)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateProduct)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);

router.route('/review').put(isAuthenticatedUser, createProductReview);

module.exports = router; 