const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { getAllUsers, deleteUser, updateUserByAdmin, getUserDetails, createUserByAdmin } = require('../controllers/authController');

router.route('/')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getAllUsers)
    .post(isAuthenticatedUser, authorizeRoles('admin'), createUserByAdmin);

router.route('/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getUserDetails)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateUserByAdmin);

module.exports = router; 