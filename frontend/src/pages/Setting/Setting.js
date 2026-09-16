import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as styles from './Setting.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../context/AuthContext.js';
import { updateSettings } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const Setting = () => {
    useHead('Cài đặt');
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
    themePreference: 'light'
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.notificationSettings) {
      setSettings(prevState => ({
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
      setSettings(prevState => ({
        ...prevState,
        privacySettings: {
          shareProfileData: user.privacySettings.shareProfileData ?? false,
          showOrderHistory: user.privacySettings.showOrderHistory ?? true,
          allowAnalytics: user.privacySettings.allowAnalytics ?? true
        }
      }));
    }

    if (user.languagePreference) {
      setSettings(prevState => ({
        ...prevState,
        languagePreference: user.languagePreference
      }));
    }

    if (user.themePreference) {
      setSettings(prevState => ({
        ...prevState,
        themePreference: user.themePreference
      }));
    }
  }, [user, navigate]);

  const handleCheckboxChange = (e, section) => {
    const { name, checked } = e.target;
    setSettings(prevState => ({
      ...prevState,
      [section]: {
        ...prevState[section],
        [name]: checked
      }
    }));
  };

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevState => ({
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
        
        showToast({
          title: "Thành công",
          message: "Thiết lập đã được cập nhật",
          type: "success",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Lỗi cập nhật thiết lập:', error);
      showToast({
        title: "Lỗi",
        message: error.message || "Không thể cập nhật thiết lập",
        type: "error",
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
        <div className={cx('pageHeader')}>
          <h1>Thiết lập</h1>
          <p>Quản lý thiết lập tài khoản của bạn</p>
        </div>

        <div className={cx('settingsContainer')}>
          <form onSubmit={handleSubmit}>
            {/* Thiết lập thông báo */}
            <div className={cx('settingsCard')}>
              <div className={cx('cardHeader')}>
                <h2>
                  <i className="fas fa-bell"></i>
                  Thông báo
                </h2>
              </div>
              <div className={cx('cardBody')}>
                <div className={cx('settingsGroup')}>
                  <div className={cx('settingItem')}>
                    <div className={cx('settingInfo')}>
                      <h3>Thông báo qua Email</h3>
                      <p>Nhận email thông báo về các hoạt động của tài khoản</p>
                    </div>
                    <div className={cx('settingControl')}>
                      <label className={cx('switch')}>
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={settings.notificationSettings.emailNotifications}
                          onChange={(e) => handleCheckboxChange(e, 'notificationSettings')}
                        />
                        <span className={cx('slider')}></span>
                      </label>
                    </div>
                  </div>

                  <div className={cx('settingItem')}>
                    <div className={cx('settingInfo')}>
                      <h3>Cập nhật đơn hàng</h3>
                      <p>Nhận thông báo khi có cập nhật về đơn hàng của bạn</p>
                    </div>
                    <div className={cx('settingControl')}>
                      <label className={cx('switch')}>
                        <input
                          type="checkbox"
                          name="orderUpdates"
                          checked={settings.notificationSettings.orderUpdates}
                          onChange={(e) => handleCheckboxChange(e, 'notificationSettings')}
                        />
                        <span className={cx('slider')}></span>
                      </label>
                    </div>
                  </div>

                  <div className={cx('settingItem')}>
                    <div className={cx('settingInfo')}>
                      <h3>Khuyến mãi & Ưu đãi</h3>
                      <p>Nhận thông báo về các chương trình khuyến mãi và ưu đãi</p>
                    </div>
                    <div className={cx('settingControl')}>
                      <label className={cx('switch')}>
                        <input
                          type="checkbox"
                          name="promotions"
                          checked={settings.notificationSettings.promotions}
                          onChange={(e) => handleCheckboxChange(e, 'notificationSettings')}
                        />
                        <span className={cx('slider')}></span>
                      </label>
                    </div>
                  </div>

                  <div className={cx('settingItem')}>
                    <div className={cx('settingInfo')}>
                      <h3>Đăng ký nhận bản tin</h3>
                      <p>Nhận bản tin định kỳ về các sản phẩm mới và tin tức</p>
                    </div>
                    <div className={cx('settingControl')}>
                      <label className={cx('switch')}>
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
              </div>
            </div>

            {/* Thiết lập quyền riêng tư */}
            <div className={cx('settingsCard')}>
              <div className={cx('cardHeader')}>
                <h2>
                  <i className="fas fa-user-shield"></i>
                  Quyền riêng tư
                </h2>
              </div>
              <div className={cx('cardBody')}>
                <div className={cx('settingsGroup')}>
                  <div className={cx('settingItem')}>
                    <div className={cx('settingInfo')}>
                      <h3>Chia sẻ dữ liệu hồ sơ</h3>
                      <p>Cho phép chia sẻ dữ liệu hồ sơ với các đối tác kinh doanh</p>
                    </div>
                    <div className={cx('settingControl')}>
                      <label className={cx('switch')}>
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

                  <div className={cx('settingItem')}>
                    <div className={cx('settingInfo')}>
                      <h3>Hiển thị lịch sử đơn hàng</h3>
                      <p>Lưu và hiển thị lịch sử đơn hàng trong tài khoản của bạn</p>
                    </div>
                    <div className={cx('settingControl')}>
                      <label className={cx('switch')}>
                        <input
                          type="checkbox"
                          name="showOrderHistory"
                          checked={settings.privacySettings.showOrderHistory}
                          onChange={(e) => handleCheckboxChange(e, 'privacySettings')}
                        />
                        <span className={cx('slider')}></span>
                      </label>
                    </div>
                  </div>

                  <div className={cx('settingItem')}>
                    <div className={cx('settingInfo')}>
                      <h3>Phân tích dữ liệu sử dụng</h3>
                      <p>Cho phép thu thập dữ liệu sử dụng để cải thiện dịch vụ</p>
                    </div>
                    <div className={cx('settingControl')}>
                      <label className={cx('switch')}>
                        <input
                          type="checkbox"
                          name="allowAnalytics"
                          checked={settings.privacySettings.allowAnalytics}
                          onChange={(e) => handleCheckboxChange(e, 'privacySettings')}
                        />
                        <span className={cx('slider')}></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thiết lập ngôn ngữ */}
            <div className={cx('settingsCard')}>
              <div className={cx('cardHeader')}>
                <h2>
                  <i className="fas fa-language"></i>
                  Ngôn ngữ
                </h2>
              </div>
              <div className={cx('cardBody')}>
                <div className={cx('settingsGroup')}>
                  <div className={cx('radioGroup')}>
                    <div className={cx('radioItem')}>
                      <input
                        type="radio"
                        id="lang-vi"
                        name="languagePreference"
                        value="vi"
                        checked={settings.languagePreference === 'vi'}
                        onChange={handleRadioChange}
                      />
                      <label htmlFor="lang-vi">Tiếng Việt</label>
                    </div>
                    <div className={cx('radioItem')}>
                      <input
                        type="radio"
                        id="lang-en"
                        name="languagePreference"
                        value="en"
                        checked={settings.languagePreference === 'en'}
                        onChange={handleRadioChange}
                      />
                      <label htmlFor="lang-en">English</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thiết lập giao diện */}
            <div className={cx('settingsCard')}>
              <div className={cx('cardHeader')}>
                <h2>
                  <i className="fas fa-palette"></i>
                  Giao diện
                </h2>
              </div>
              <div className={cx('cardBody')}>
                <div className={cx('settingsGroup')}>
                  <div className={cx('radioGroup')}>
                    <div className={cx('radioItem')}>
                      <input
                        type="radio"
                        id="theme-light"
                        name="themePreference"
                        value="light"
                        checked={settings.themePreference === 'light'}
                        onChange={handleRadioChange}
                      />
                      <label htmlFor="theme-light">Sáng</label>
                    </div>
                    <div className={cx('radioItem')}>
                      <input
                        type="radio"
                        id="theme-dark"
                        name="themePreference"
                        value="dark"
                        checked={settings.themePreference === 'dark'}
                        onChange={handleRadioChange}
                      />
                      <label htmlFor="theme-dark">Tối</label>
                    </div>
                    <div className={cx('radioItem')}>
                      <input
                        type="radio"
                        id="theme-system"
                        name="themePreference"
                        value="system"
                        checked={settings.themePreference === 'system'}
                        onChange={handleRadioChange}
                      />
                      <label htmlFor="theme-system">Theo hệ thống</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={cx('formActions')}>
              <button type="submit" className={cx('saveButton')} disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thiết lập'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Setting;
