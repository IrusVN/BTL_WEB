import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as styles from './ChangePassword.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../context/AuthContext.js';
import { updatePassword } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import Breadcrumb from '../../components/Breadcrumb/index.js';
import AccountNav from '../../components/AccountNav/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const ChangePassword = () => {
    useHead('Đổi mật khẩu | Team2hand');
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [formErrors, setFormErrors] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        let isValid = true;
        const errors = {
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        };

        if (!formData.oldPassword.trim()) {
            errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
            isValid = false;
        }

        if (!formData.newPassword.trim()) {
            errors.newPassword = 'Vui lòng nhập mật khẩu mới';
            isValid = false;
        } else if (formData.newPassword.length < 6) {
            errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
            isValid = false;
        }

        if (!formData.confirmPassword.trim()) {
            errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
            isValid = false;
        } else if (formData.newPassword !== formData.confirmPassword) {
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu mới';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await updatePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            if (response.success) {
                if (response.token) {
                    localStorage.setItem('token', response.token);
                }

                setFormData({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });

                showToast({
                    title: 'Thành công',
                    message: 'Mật khẩu của bạn đã được cập nhật thành công',
                    type: 'success',
                    duration: 3500
                });
            }
        } catch (error) {
            console.error('Lỗi đổi mật khẩu:', error);
            showToast({
                title: 'Lỗi',
                message: error.response?.data?.message || error.message || 'Không thể đổi mật khẩu lúc này',
                type: 'error',
                duration: 3500
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className={cx('changePasswordPage')}>
            <div className={cx('container')}>
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Thông tin tài khoản', to: '/profile' },
                        { label: 'Đổi mật khẩu' }
                    ]}
                />

                {/* Sub-navigation Tabs */}
                <AccountNav />

                {/* Page Title */}
                <div className={cx('pageHeader')}>
                    <h1 className={cx('pageTitle')}>ĐỔI MẬT KHẨU</h1>
                    <p className={cx('pageDesc')}>
                        Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu của bạn với bất kỳ ai
                    </p>
                </div>

                <div className={cx('changePasswordContainer')}>
                    <div className={cx('changePasswordCard')}>
                        <form onSubmit={handleSubmit}>
                            {/* Mật khẩu hiện tại */}
                            <div className={cx('formGroup')}>
                                <label htmlFor="oldPassword">
                                    MẬT KHẨU HIỆN TẠI <span className={cx('required')}>*</span>
                                </label>
                                <div className={cx('inputWrap')}>
                                    <input
                                        type={showOldPassword ? 'text' : 'password'}
                                        id="oldPassword"
                                        name="oldPassword"
                                        value={formData.oldPassword}
                                        onChange={handleChange}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        className={formErrors.oldPassword ? cx('hasError') : ''}
                                    />
                                    {formData.oldPassword.length > 0 && (
                                        <button
                                            type="button"
                                            className={cx('eyeToggleBtn')}
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                            title={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            <i className={showOldPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                                        </button>
                                    )}
                                </div>
                                {formErrors.oldPassword && (
                                    <p className={cx('errorMessage')}>{formErrors.oldPassword}</p>
                                )}
                            </div>

                            {/* Mật khẩu mới */}
                            <div className={cx('formGroup')}>
                                <label htmlFor="newPassword">
                                    MẬT KHẨU MỚI <span className={cx('required')}>*</span>
                                </label>
                                <div className={cx('inputWrap')}>
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        id="newPassword"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Tối thiểu 6 ký tự"
                                        className={formErrors.newPassword ? cx('hasError') : ''}
                                    />
                                    {formData.newPassword.length > 0 && (
                                        <button
                                            type="button"
                                            className={cx('eyeToggleBtn')}
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                            title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            <i className={showNewPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                                        </button>
                                    )}
                                </div>
                                {formErrors.newPassword && (
                                    <p className={cx('errorMessage')}>{formErrors.newPassword}</p>
                                )}
                            </div>

                            {/* Xác nhận mật khẩu mới */}
                            <div className={cx('formGroup')}>
                                <label htmlFor="confirmPassword">
                                    XÁC NHẬN MẬT KHẨU MỚI <span className={cx('required')}>*</span>
                                </label>
                                <div className={cx('inputWrap')}>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Nhập lại mật khẩu mới"
                                        className={formErrors.confirmPassword ? cx('hasError') : ''}
                                    />
                                    {formData.confirmPassword.length > 0 && (
                                        <button
                                            type="button"
                                            className={cx('eyeToggleBtn')}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                            title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            <i className={showConfirmPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                                        </button>
                                    )}
                                </div>
                                {formErrors.confirmPassword && (
                                    <p className={cx('errorMessage')}>{formErrors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Tiêu chí mật khẩu */}
                            <div className={cx('requirementsCard')}>
                                <div className={cx('reqHeader')}>
                                    <i className="fas fa-shield-alt"></i>
                                    <span>YÊU CẦU MẬT KHẨU AN TOÀN:</span>
                                </div>
                                <ul className={cx('reqList')}>
                                    <li className={cx({ fulfilled: formData.newPassword.length >= 6 })}>
                                        <i className={formData.newPassword.length >= 6 ? 'fas fa-check' : 'fas fa-circle'}></i>
                                        <span>Độ dài tối thiểu từ 6 ký tự trở lên</span>
                                    </li>
                                    <li
                                        className={cx({
                                            fulfilled:
                                                formData.newPassword.length > 0 &&
                                                formData.newPassword !== formData.oldPassword
                                        })}
                                    >
                                        <i
                                            className={
                                                formData.newPassword.length > 0 &&
                                                formData.newPassword !== formData.oldPassword
                                                    ? 'fas fa-check'
                                                    : 'fas fa-circle'
                                            }
                                        ></i>
                                        <span>Không được trùng với mật khẩu hiện tại</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Action Button */}
                            <div className={cx('formActions')}>
                                <button
                                    type="submit"
                                    className={cx('submitBtn')}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className={cx('btnSpinner')}></div>
                                            <span>ĐANG CẬP NHẬT...</span>
                                        </>
                                    ) : (
                                        <span>CẬP NHẬT MẬT KHẨU</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
