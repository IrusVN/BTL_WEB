const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createTransporter } = require('../services/emailService');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        const user = await User.create({
            name,
            email,
            password
        });

        const token = user.getJwtToken();

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000 || 7 * 24 * 60 * 60 * 1000),
            httpOnly: true
        };

        res.status(201)
            .cookie('token', token, options)
            .json({
                success: true,
                token,
                user
            });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu'
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        const isPasswordMatched = await user.comparePassword(password);

        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        const token = user.getJwtToken();

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000 || 7 * 24 * 60 * 60 * 1000),
            httpOnly: true
        };

        res.status(200)
            .cookie('token', token, options)
            .json({
                success: true,
                token,
                user
            });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email
        };

        if (req.body.phoneNumber) {
            newUserData.phoneNumber = req.body.phoneNumber;
        }

        if (req.body.address && Array.isArray(req.body.address)) {
            newUserData.address = req.body.address;
        }

        const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới không khớp'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        const user = await User.findById(req.user.id).select('+password');

        const isPasswordMatched = await user.comparePassword(oldPassword);

        if (!isPasswordMatched) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        user.password = newPassword;
        await user.save();

        const token = user.getJwtToken();

        const options = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000 || 7 * 24 * 60 * 60 * 1000),
            httpOnly: true
        };

        res.status(200)
            .cookie('token', token, options)
            .json({
                success: true,
                message: 'Đổi mật khẩu thành công',
                token
            });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { notificationSettings, privacySettings, languagePreference, themePreference } = req.body;

        const updateData = {};

        if (notificationSettings) {
            updateData.notificationSettings = notificationSettings;
        }

        if (privacySettings) {
            updateData.privacySettings = privacySettings;
        }

        if (languagePreference) {
            updateData.languagePreference = languagePreference;
        }

        if (themePreference) {
            updateData.themePreference = themePreference;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có dữ liệu để cập nhật'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật thiết lập thành công',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.logout = async (req, res) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công'
    });
};

exports.createUserByAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }

        const { name, email, password, role, phone, phoneNumber, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email này đã tồn tại trong hệ thống'
            });
        }

        const newUserData = {
            name,
            email,
            password,
            role: role || 'user'
        };

        if (phoneNumber || phone) {
            newUserData.phoneNumber = phoneNumber || phone;
        }

        if (address) {
            if (Array.isArray(address)) {
                newUserData.address = address;
            } else if (typeof address === 'string') {
                newUserData.address = [{ street: address, city: '', country: 'Việt Nam' }];
            }
        }

        const user = await User.create(newUserData);

        return res.status(201).json({
            success: true,
            user,
            message: 'Tạo người dùng mới thành công'
        });
    } catch (error) {
        console.error('Lỗi khi admin tạo user:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi tạo người dùng'
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tính năng này'
            });
        }

        const users = await User.find().select('-password');

        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách users:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách người dùng'
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }

        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể xóa tài khoản của chính mình'
            });
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: 'Người dùng đã được xóa thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa user:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa người dùng'
        });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy thông tin người dùng'
        });
    }
};

exports.updateUserByAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }

        const userId = req.params.id;
        const { name, email, role, phone, phoneNumber, address, password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const updatedData = {
            name: name || user.name,
            email: email || user.email,
            role: role || user.role
        };

        if (phoneNumber !== undefined) {
            updatedData.phoneNumber = phoneNumber;
        } else if (phone !== undefined) {
            updatedData.phoneNumber = phone;
        }

        if (address !== undefined) {
            updatedData.address = address;
        }

        if (password && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
                });
            }
            updatedData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updatedData,
            { new: true, runValidators: true }
        ).select('-password');

        return res.status(200).json({
            success: true,
            user: updatedUser,
            message: 'Cập nhật thông tin người dùng thành công'
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật user:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi cập nhật thông tin người dùng'
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi'
            });
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

        const transporter = await createTransporter();
        const mailOptions = {
            from: `"Team2hand" <${process.env.EMAIL}>`,
            to: user.email,
            subject: 'Đặt lại mật khẩu Team2hand',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #D4AF37; margin-top: 0;">Đặt lại mật khẩu</h2>
                <p>Chào <b>${user.name}</b>,</p>
                <p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản Team2hand của bạn.</p>
                <p>Bấm nút bên dưới để đặt lại mật khẩu. Link có hiệu lực <b>15 phút</b>.</p>
                <p style="text-align: center; margin: 28px 0;">
                  <a href="${resetUrl}"
                     style="background: #D4AF37; color: #0A0A0C; padding: 12px 28px; border-radius: 999px;
                            text-decoration: none; font-weight: bold; display: inline-block;">
                    Đặt lại mật khẩu
                  </a>
                </p>
                <p style="color: #888; font-size: 13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu của bạn vẫn được giữ nguyên.</p>
                <hr style="border: none; border-top: 1px solid #eee;">
                <p style="color: #aaa; font-size: 12px;">© Team2hand — Email tự động, vui lòng không trả lời.</p>
              </div>
            `
        };
        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu đã được gửi'
        });
    } catch (error) {
        console.error('Lỗi khi gửi email đặt lại mật khẩu:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.'
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới không khớp'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
            });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Đặt lại mật khẩu thành công'
        });
    } catch (error) {
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi đặt lại mật khẩu'
        });
    }
};
