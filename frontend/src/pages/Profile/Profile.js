import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as styles from './Profile.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../context/AuthContext.js';
import { updateProfile } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const Profile = () => {
    useHead('Hồ sơ');
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
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
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
        address: [{
          street: formData.address.street,
          city: formData.address.city,
          country: formData.address.country,
          zipCode: formData.address.zipCode
        }]
      };

      const response = await updateProfile(userData);
      if (response.success) {
        login(response.user, localStorage.getItem('token'));
        
        showToast({
          title: "Thành công",
          message: "Thông tin tài khoản đã được cập nhật",
          type: "success",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      showToast({
        title: "Lỗi",
        message: error.message || "Không thể cập nhật thông tin tài khoản",
        type: "error",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className={cx('profilePage')}>
      <div className={cx('container')}>
        <div className={cx('pageHeader')}>
          <h1>Thông tin tài khoản</h1>
          <p>Quản lý thông tin cá nhân của bạn</p>
        </div>

        <div className={cx('profileContainer')}>
          <div className={cx('profileCard')}>
            <div className={cx('profileHeader')}>
              <div className={cx('profileAvatar')}>
                <img 
                  src={user.avatar || 'https://via.placeholder.com/150'} 
                  alt={user.name} 
                />
              </div>
              <div className={cx('profileInfo')}>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <span className={cx('userRole')}>{user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</span>
              </div>
            </div>

            <div className={cx('profileContent')}>
              <form onSubmit={handleSubmit}>
                <div className={cx('formSection')}>
                  <h3>Thông tin cá nhân</h3>
                  
                  <div className={cx('formGroup')}>
                    <label htmlFor="name">Họ và tên</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className={cx('formGroup')}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className={cx('formGroup')}>
                    <label htmlFor="phoneNumber">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className={cx('formSection')}>
                  <h3>Địa chỉ</h3>
                  
                  <div className={cx('formGroup')}>
                    <label htmlFor="address.street">Địa chỉ</label>
                    <input
                      type="text"
                      id="address.street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className={cx('formRow')}>
                    <div className={cx('formGroup')}>
                      <label htmlFor="address.city">Thành phố</label>
                      <input
                        type="text"
                        id="address.city"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className={cx('formGroup')}>
                      <label htmlFor="address.zipCode">Mã bưu điện</label>
                      <input
                        type="text"
                        id="address.zipCode"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className={cx('formGroup')}>
                    <label htmlFor="address.country">Quốc gia</label>
                    <input
                      type="text"
                      id="address.country"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className={cx('formActions')}>
                  <button 
                    type="submit" 
                    className={cx('saveButton')}
                    disabled={loading}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
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
