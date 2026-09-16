const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.route('/categories').get((req, res) => {
    res.status(200).json({
        success: true,
        categories: []
    });
});

module.exports = router; 