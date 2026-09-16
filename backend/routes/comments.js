const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { isAuthenticatedUser } = require('../middleware/auth');

router.get('/product/:productId', commentController.getProductComments);

router.post('/product/:productId', isAuthenticatedUser, commentController.addComment);

router.put('/:commentId', isAuthenticatedUser, commentController.updateComment);

router.delete('/:commentId', isAuthenticatedUser, commentController.deleteComment);

module.exports = router; 