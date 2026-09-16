const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { getAllUsers, deleteUser, updateUserByAdmin } = require('../controllers/authController');

router.route('/').get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers);

router.route('/:id').delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser);

router.route('/:id').put(isAuthenticatedUser, authorizeRoles('admin'), updateUserByAdmin);

module.exports = router; 