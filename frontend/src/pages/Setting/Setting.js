import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as styles from './Setting.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../context/AuthContext.js';
import { updateSettings } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import Breadcrumb from '../../components/Breadcrumb/index.js';
import AccountNav from '../../components/AccountNav/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const Setting = () => {
    useHead('Cài đặt tài khoản | Team2hand');
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        notificationSettings: {
            emailNotifications: true,
            orderUpdates: true,
            promotions: true,
            newsletter: false
        },
        privacySettings: {
            shareProfileData: false,
            showOrderHistory: true,
            allowAnalytics: true
        },
        languagePreference: 'vi',
        themePreference: 'dark'
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const savedTheme = localStorage.getItem('theme') || 'dark';

        if (user.notificationSettings) {
            setSettings((prevState) => ({
                ...prevState,
                notificationSettings: {
                    emailNotifications: user.notificationSettings.emailNotifications ?? true,
                    orderUpdates: user.notificationSettings.orderUpdates ?? true,
                    promotions: user.notificationSettings.promotions ?? true,
                    newsletter: user.notificationSettings.newsletter ?? false
                }
            }));
        }

        if (user.privacySettings) {
            setSettings((prevState) => ({
                ...prevState,
                privacySettings: {
                    shareProfileData: user.privacySettings.shareProfileData ?? false,
                    showOrderHistory: user.privacySettings.showOrderHistory ?? true,
                    allowAnalytics: user.privacySettings.allowAnalytics ?? true
                }
            }));
        }

        if (user.languagePreference) {
            setSettings((prevState) => ({
                ...prevState,
                languagePreference: user.languagePreference
            }));
        }

        setSettings((prevState) => ({
            ...prevState,
            themePreference: user.themePreference || savedTheme
        }));
    }, [user, navigate]);

    const handleCheckboxChange = (e, section) => {
        const { name, checked } = e.target;
        setSettings((prevState) => ({
            ...prevState,
            [section]: {
                ...prevState[section],
                [name]: checked
            }
        }));
    };

    const handleRadioChange = (name, value) => {
        setSettings((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await updateSettings(settings);

            if (response.success) {
                if (response.user) {
                    login(response.user, localStorage.getItem('token'));
                }

                // Synchronize theme with html and localStorage
                if (settings.themePreference) {
                    let targetTheme = settings.themePreference;
                    if (targetTheme === 'system') {
                        targetTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    document.documentElement.setAttribute('data-theme', targetTheme);
                    try {
                        localStorage.setItem('theme', settings.themePreference);
                    } catch (err) {
                        console.warn('Cannot write theme to localStorage', err);
                    }
                }

                showToast({
                    title: 'Thành công',
                    message: 'Thiết lập tài khoản đã được lưu thành công',
                    type: 'success',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi cập nhật thiết lập:', error);
            showToast({
                title: 'Lỗi',
                message: error.message || 'Không thể cập nhật thiết lập lúc này',
                type: 'error',
                duration: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className={cx('settingsPage')}>
            <div className={cx('container')}>
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Thông tin tài khoản', to: '/profile' },
                        { label: 'Cài đặt' }
                    ]}
                />

                {/* Sub-navigation Tabs */}
                <AccountNav />

                {/* Page Title */}
                <div className={cx('pageHeader')}>
                    <h1 className={cx('pageTitle')}>CÀI ĐẶT HỆ THỐNG</h1>
                    <p className={cx('pageDesc')}>
                        Tùy chỉnh thông báo cá nhân, quyền riêng tư và trải nghiệm giao diện người dùng
                    </p>
                </div>

                <div className={cx('settingsContainer')}>
                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Thông báo */}
                        <div className={cx('settingsCard')}>
                            <div className={cx('cardHeader')}>
                                <div className={cx('headerTitleGroup')}>
                                    <i className="fas fa-bell"></i>
                                    <h2>THÔNG BÁO & TIN TỨC</h2>
                                </div>
                                <span className={cx('headerSub')}>Email & Tin nhắn</span>
                            </div>
                            <div className={cx('cardBody')}>
                                <div className={cx('settingItem')}>
                                    <div className={cx('settingInfo')}>
                                        <h3>Thông báo qua Email</h3>
                                        <p>Nhận email thông báo về các hoạt động bảo mật và xác nhận tài khoản</p>
                                    </div>
                                    <label className={cx('luxurySwitch')}>
                                        <input
                                            type="checkbox"
                                            name="emailNotifications"
                                            checked={settings.notificationSettings.emailNotifications}
                                            onChange={(e) => handleCheckboxChange(e, 'notificationSettings')}
                                        />
                                        <span className={cx('slider')}></span>
                                    </label>
                                </div>

                                <div className={cx('settingItem')}>
                                    <div className={cx('settingInfo')}>
                                        <h3>Cập nhật trạng thái đơn hàng</h3>
                                        <p>Nhận thông báo ngay lập tức khi đơn hàng được xác nhận hoặc giao đi</p>
                                    </div>
                                    <label className={cx('luxurySwitch')}>
                                        <input
                                            type="checkbox"
                                            name="orderUpdates"
                                            checked={settings.notificationSettings.orderUpdates}
                                            onChange={(e) => handleCheckboxChange(e, 'notificationSettings')}
                                        />
                                        <span className={cx('slider')}></span>
                                    </label>
                                </div>

                                <div className={cx('settingItem')}>
                                    <div className={cx('settingInfo')}>
                                        <h3>Khuyến mãi & Bộ sưu tập độc quyền</h3>
                                        <p>Nhận thông báo ưu tiên khi có chiến dịch private sale hoặc ra mắt mẫu mới</p>
                                    </div>
                                    <label className={cx('luxurySwitch')}>
                                        <input
                                            type="checkbox"
                                            name="promotions"
                                            checked={settings.notificationSettings.promotions}
                                            onChange={(e) => handleCheckboxChange(e, 'notificationSettings')}
                                        />
                                        <span className={cx('slider')}></span>
                                    </label>
                                </div>

                                <div className={cx('settingItem')}>
                                    <div className={cx('settingInfo')}>
                                        <h3>Bản tin định kỳ (Newsletter)</h3>
                                        <p>Nhận bản tin tổng hợp xu hướng thời trang luxury hàng tháng</p>
                                    </div>
                                    <label className={cx('luxurySwitch')}>
                                        <input
                                            type="checkbox"
                                            name="newsletter"
                                            checked={settings.notificationSettings.newsletter}
                                            onChange={(e) => handleCheckboxChange(e, 'notificationSettings')}
                                        />
                                        <span className={cx('slider')}></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Quyền riêng tư */}
                        <div className={cx('settingsCard')}>
                            <div className={cx('cardHeader')}>
                                <div className={cx('headerTitleGroup')}>
                                    <i className="fas fa-user-shield"></i>
                                    <h2>QUYỀN RIÊNG TƯ & DỮ LIỆU</h2>
                                </div>
                                <span className={cx('headerSub')}>Bảo mật</span>
                            </div>
                            <div className={cx('cardBody')}>
                                <div className={cx('settingItem')}>
                                    <div className={cx('settingInfo')}>
                                        <h3>Hiển thị lịch sử mua hàng</h3>
                                        <p>Lưu trữ và hiển thị các đơn hàng đã đặt trong trang Đơn hàng của tôi</p>
                                    </div>
                                    <label className={cx('luxurySwitch')}>
                                        <input
                                            type="checkbox"
                                            name="showOrderHistory"
                                            checked={settings.privacySettings.showOrderHistory}
                                            onChange={(e) => handleCheckboxChange(e, 'privacySettings')}
                                        />
                                        <span className={cx('slider')}></span>
                                    </label>
                                </div>

                                <div className={cx('settingItem')}>
                                    <div className={cx('settingInfo')}>
                                        <h3>Phân tích dữ liệu trải nghiệm</h3>
                                        <p>Cho phép thu thập dữ liệu ẩn danh để tối ưu hóa tốc độ và giao diện website</p>
                                    </div>
                                    <label className={cx('luxurySwitch')}>
                                        <input
                                            type="checkbox"
                                            name="allowAnalytics"
                                            checked={settings.privacySettings.allowAnalytics}
                                            onChange={(e) => handleCheckboxChange(e, 'privacySettings')}
                                        />
                                        <span className={cx('slider')}></span>
                                    </label>
                                </div>

                                <div className={cx('settingItem')}>
                                    <div className={cx('settingInfo')}>
                                        <h3>Chia sẻ thông tin với đối tác vận chuyển</h3>
                                        <p>Chia sẻ số điện thoại và địa chỉ giao hàng với đơn vị vận chuyển đối tác</p>
                                    </div>
                                    <label className={cx('luxurySwitch')}>
                                        <input
                                            type="checkbox"
                                            name="shareProfileData"
                                            checked={settings.privacySettings.shareProfileData}
                                            onChange={(e) => handleCheckboxChange(e, 'privacySettings')}
                                        />
                                        <span className={cx('slider')}></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Ngôn ngữ */}
                        <div className={cx('settingsCard')}>
                            <div className={cx('cardHeader')}>
                                <div className={cx('headerTitleGroup')}>
                                    <i className="fas fa-globe"></i>
                                    <h2>NGÔN NGỮ HIỂN THỊ</h2>
                                </div>
                                <span className={cx('headerSub')}>Quốc tế</span>
                            </div>
                            <div className={cx('cardBody')}>
                                <div className={cx('cardOptionsGrid')}>
                                    <div
                                        className={cx('optionCard', { active: settings.languagePreference === 'vi' })}
                                        onClick={() => handleRadioChange('languagePreference', 'vi')}
                                    >
                                        <div className={cx('radioIndicator', { checked: settings.languagePreference === 'vi' })}></div>
                                        <div className={cx('optionInfo')}>
                                            <span className={cx('optionLabel')}>TIẾNG VIỆT</span>
                                            <span className={cx('optionDesc')}>Giao diện chuẩn tiếng Việt (Mặc định)</span>
                                        </div>
                                    </div>

                                    <div
                                        className={cx('optionCard', { active: settings.languagePreference === 'en' })}
                                        onClick={() => handleRadioChange('languagePreference', 'en')}
                                    >
                                        <div className={cx('radioIndicator', { checked: settings.languagePreference === 'en' })}></div>
                                        <div className={cx('optionInfo')}>
                                            <span className={cx('optionLabel')}>ENGLISH</span>
                                            <span className={cx('optionDesc')}>International English interface</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Giao diện Theme */}
                        <div className={cx('settingsCard')}>
                            <div className={cx('cardHeader')}>
                                <div className={cx('headerTitleGroup')}>
                                    <i className="fas fa-palette"></i>
                                    <h2>CHẾ ĐỘ GIAO DIỆN</h2>
                                </div>
                                <span className={cx('headerSub')}>Theme</span>
                            </div>
                            <div className={cx('cardBody')}>
                                <div className={cx('cardOptionsGrid', 'threeCols')}>
                                    <div
                                        className={cx('optionCard', { active: settings.themePreference === 'dark' })}
                                        onClick={() => handleRadioChange('themePreference', 'dark')}
                                    >
                                        <div className={cx('radioIndicator', { checked: settings.themePreference === 'dark' })}></div>
                                        <div className={cx('optionInfo')}>
                                            <span className={cx('optionLabel')}>OBSIDIAN DARK</span>
                                            <span className={cx('optionDesc')}>Nền đen luxury & ánh vàng (Khuyên dùng)</span>
                                        </div>
                                    </div>

                                    <div
                                        className={cx('optionCard', { active: settings.themePreference === 'light' })}
                                        onClick={() => handleRadioChange('themePreference', 'light')}
                                    >
                                        <div className={cx('radioIndicator', { checked: settings.themePreference === 'light' })}></div>
                                        <div className={cx('optionInfo')}>
                                            <span className={cx('optionLabel')}>PURE LIGHT</span>
                                            <span className={cx('optionDesc')}>Nền sáng tinh tế, độ tương phản cao</span>
                                        </div>
                                    </div>

                                    <div
                                        className={cx('optionCard', { active: settings.themePreference === 'system' })}
                                        onClick={() => handleRadioChange('themePreference', 'system')}
                                    >
                                        <div className={cx('radioIndicator', { checked: settings.themePreference === 'system' })}></div>
                                        <div className={cx('optionInfo')}>
                                            <span className={cx('optionLabel')}>THEO THIẾT BỊ</span>
                                            <span className={cx('optionDesc')}>Tự động đồng bộ với hệ điều hành</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className={cx('formActions')}>
                            <button
                                type="submit"
                                className={cx('submitBtn')}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className={cx('btnSpinner')}></div>
                                        <span>ĐANG LƯU THIẾT LẬP...</span>
                                    </>
                                ) : (
                                    <span>LƯU TẤT CẢ THIẾT LẬP</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Setting;
