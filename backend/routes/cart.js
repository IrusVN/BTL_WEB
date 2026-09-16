const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middleware/auth');
const { 
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    createOrderFromCart
} = require('../controllers/cartController');

router.get('/', isAuthenticatedUser, getCart);

router.post('/add', isAuthenticatedUser, addToCart);

router.put('/update', isAuthenticatedUser, updateCartItem);

router.delete('/remove/:itemId', isAuthenticatedUser, removeFromCart);

router.delete('/clear', isAuthenticatedUser, clearCart);

router.post('/checkout', isAuthenticatedUser, createOrderFromCart);

module.exports = router; 