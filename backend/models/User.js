const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên'],
        maxLength: [30, 'Tên không được vượt quá 30 ký tự']
    },
    email: {
        type: String,
        required: [true, 'Vui lòng nhập email'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu'],
        minLength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        select: false
    },
    avatar: {
        type: String,
        default: 'default-avatar.jpg'
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    address: [{
        street: String,
        city: String,
        country: String,
        zipCode: String
    }],
    phoneNumber: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    notificationSettings: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        orderUpdates: {
            type: Boolean,
            default: true
        },
        promotions: {
            type: Boolean,
            default: true
        },
        newsletter: {
            type: Boolean,
            default: false
        }
    },
    privacySettings: {
        shareProfileData: {
            type: Boolean,
            default: false
        },
        showOrderHistory: {
            type: Boolean,
            default: true
        },
        allowAnalytics: {
            type: Boolean,
            default: true
        }
    },
    languagePreference: {
        type: String,
        enum: ['vi', 'en'],
        default: 'vi'
    },
    themePreference: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    return resetToken;
};

module.exports = mongoose.model('User', userSchema); 