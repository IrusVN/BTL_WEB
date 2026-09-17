import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as styles from './Profile.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../context/AuthContext.js';
import { updateProfile } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import Breadcrumb from '../../components/Breadcrumb/index.js';
import AccountNav from '../../components/AccountNav/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const Profile = () => {
    useHead('Thông tin tài khoản | Team2hand');
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        address: {
            street: '',
            city: '',
            country: '',
            zipCode: ''
        }
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        setFormData({
            name: user.name || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            address: {
                street: user.address && user.address[0] ? user.address[0].street || '' : '',
                city: user.address && user.address[0] ? user.address[0].city || '' : '',
                country: user.address && user.address[0] ? user.address[0].country || '' : '',
                zipCode: user.address && user.address[0] ? user.address[0].zipCode || '' : ''
            }
        });
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                address: [
                    {
                        street: formData.address.street,
                        city: formData.address.city,
                        country: formData.address.country,
                        zipCode: formData.address.zipCode
                    }
                ]
            };

            const response = await updateProfile(userData);
            if (response.success) {
                login(response.user, localStorage.getItem('token'));

                showToast({
                    title: 'Thành công',
                    message: 'Thông tin tài khoản đã được cập nhật thành công',
                    type: 'success',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi cập nhật hồ sơ:', error);
            showToast({
                title: 'Lỗi',
                message: error.message || 'Không thể cập nhật thông tin tài khoản',
                type: 'error',
                duration: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const userInitial = user.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

    return (
        <div className={cx('profilePage')}>
            <div className={cx('container')}>
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Thông tin tài khoản' }
                    ]}
                />

                {/* Sub-navigation Tabs */}
                <AccountNav />

                {/* Page Title Header */}
                <div className={cx('pageHeader')}>
                    <h1 className={cx('pageTitle')}>HỒ SƠ CÁ NHÂN</h1>
                    <p className={cx('pageDesc')}>
                        Quản lý định danh tài khoản, thông tin liên lạc và địa chỉ giao nhận hàng
                    </p>
                </div>

                <div className={cx('profileContainer')}>
                    <div className={cx('profileCard')}>
                        {/* Avatar & User Header */}
                        <div className={cx('profileHeader')}>
                            <div className={cx('avatarWrapper')}>
                                {user.avatar && !user.avatar.includes('default-avatar') && !user.avatar.includes('placeholder') ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className={cx('avatarImg')}
                                    />
                                ) : (
                                    <div className={cx('avatarFallback')}>{userInitial}</div>
                                )}
                            </div>

                            <div className={cx('profileMeta')}>
                                <div className={cx('userNameRow')}>
                                    <h2 className={cx('userName')}>{user.name}</h2>
                                    <span className={cx('roleBadge', { isAdmin: user.role === 'admin' })}>
                                        {user.role === 'admin' ? 'QUẢN TRỊ VIÊN' : 'THÀNH VIÊN'}
                                    </span>
                                </div>
                                <p className={cx('userEmail')}>{user.email}</p>
                                {user.phoneNumber && (
                                    <p className={cx('userPhone')}>
                                        <i className="fas fa-phone-alt"></i>
                                        <span>{user.phoneNumber}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className={cx('profileContent')}>
                            <form onSubmit={handleSubmit}>
                                {/* Section 1: Thông tin cá nhân */}
                                <div className={cx('formSection')}>
                                    <div className={cx('sectionHeading')}>
                                        <span className={cx('sectionIndex')}>01</span>
                                        <span className={cx('sectionTitle')}>THÔNG TIN LIÊN LẠC</span>
                                    </div>

                                    <div className={cx('formRow')}>
                                        <div className={cx('formGroup')}>
                                            <label htmlFor="name">
                                                HỌ VÀ TÊN <span className={cx('required')}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Nguyễn Văn A"
                                                required
                                            />
                                        </div>

                                        <div className={cx('formGroup')}>
                                            <label htmlFor="email">
                                                ĐỊA CHỈ EMAIL <span className={cx('required')}>*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="email@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={cx('formGroup')}>
                                        <label htmlFor="phoneNumber">SỐ ĐIỆN THOẠI</label>
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            placeholder="0987 654 321"
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Địa chỉ giao hàng */}
                                <div className={cx('formSection')}>
                                    <div className={cx('sectionHeading')}>
                                        <span className={cx('sectionIndex')}>02</span>
                                        <span className={cx('sectionTitle')}>ĐỊA CHỈ GIAO NHẬN MẶC ĐỊNH</span>
                                    </div>

                                    <div className={cx('formGroup')}>
                                        <label htmlFor="address.street">ĐỊA CHỈ ĐƯỜNG / SỐ NHÀ</label>
                                        <input
                                            type="text"
                                            id="address.street"
                                            name="address.street"
                                            value={formData.address.street}
                                            onChange={handleChange}
                                            placeholder="Số 123 đường Lê Lợi, Phường Bến Nghé"
                                        />
                                    </div>

                                    <div className={cx('formRow')}>
                                        <div className={cx('formGroup')}>
                                            <label htmlFor="address.city">TỈNH / THÀNH PHỐ</label>
                                            <input
                                                type="text"
                                                id="address.city"
                                                name="address.city"
                                                value={formData.address.city}
                                                onChange={handleChange}
                                                placeholder="Hà Nội, TP. Hồ Chí Minh..."
                                            />
                                        </div>

                                        <div className={cx('formGroup')}>
                                            <label htmlFor="address.zipCode">MÃ BƯU ĐIỆN (ZIP CODE)</label>
                                            <input
                                                type="text"
                                                id="address.zipCode"
                                                name="address.zipCode"
                                                value={formData.address.zipCode}
                                                onChange={handleChange}
                                                placeholder="700000"
                                            />
                                        </div>
                                    </div>

                                    <div className={cx('formGroup')}>
                                        <label htmlFor="address.country">QUỐC GIA</label>
                                        <input
                                            type="text"
                                            id="address.country"
                                            name="address.country"
                                            value={formData.address.country}
                                            onChange={handleChange}
                                            placeholder="Việt Nam"
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className={cx('formActions')}>
                                    <button
                                        type="submit"
                                        className={cx('saveButton')}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className={cx('btnSpinner')}></div>
                                                <span>ĐANG LƯU THAY ĐỔI...</span>
                                            </>
                                        ) : (
                                            <span>LƯU THAY ĐỔI</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
