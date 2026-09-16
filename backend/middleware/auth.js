const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        let token = req.cookies.token;
        console.log('Cookie token:', token);
        
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Header token:', token);
        }

        if (!token) {
            console.log('No token found');
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để truy cập tài nguyên này'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);
            req.user = await User.findById(decoded.id);
            console.log('User found:', req.user ? req.user.name : 'No user');
            next();
        } catch (jwtError) {
            console.log('JWT Verification error:', jwtError.message);
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }
    } catch (error) {
        console.log('Authentication error:', error.message);
        res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tài nguyên này'
            });
        }
        next();
    };
}; 