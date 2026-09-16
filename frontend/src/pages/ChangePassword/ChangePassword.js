import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as styles from './ChangePassword.module.scss';
import classNames from 'classnames/bind';
import { useAuth } from '../../context/AuthContext.js';
import { updatePassword } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const ChangePassword = () => {
    useHead('Đổi mật khẩu');
  const { user, login } = useAuth();
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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
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
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
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
          title: "Thành công",
          message: "Đổi mật khẩu thành công",
          type: "success",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      showToast({
        title: "Lỗi",
        message: error.message || "Không thể đổi mật khẩu",
        type: "error",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className={cx('changePasswordPage')}>
      <div className={cx('container')}>
        <div className={cx('pageHeader')}>
          <h1>Đổi mật khẩu</h1>
          <p>Cập nhật mật khẩu tài khoản của bạn</p>
        </div>

        <div className={cx('changePasswordContainer')}>
          <div className={cx('changePasswordCard')}>
            <form onSubmit={handleSubmit}>
              <div className={cx('formGroup')}>
                <label htmlFor="oldPassword">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  id="oldPassword"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  className={formErrors.oldPassword ? cx('error') : ''}
                />
                {formErrors.oldPassword && <p className={cx('errorMessage')}>{formErrors.oldPassword}</p>}
              </div>
              
              <div className={cx('formGroup')}>
                <label htmlFor="newPassword">Mật khẩu mới</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới"
                  className={formErrors.newPassword ? cx('error') : ''}
                />
                {formErrors.newPassword && <p className={cx('errorMessage')}>{formErrors.newPassword}</p>}
              </div>
              
              <div className={cx('formGroup')}>
                <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className={formErrors.confirmPassword ? cx('error') : ''}
                />
                {formErrors.confirmPassword && <p className={cx('errorMessage')}>{formErrors.confirmPassword}</p>}
              </div>
              
              <div className={cx('passwordRequirements')}>
                <h3>Yêu cầu mật khẩu:</h3>
                <ul>
                  <li>Ít nhất 6 ký tự</li>
                  <li>Không được giống với mật khẩu hiện tại</li>
                </ul>
              </div>
              
              <div className={cx('formActions')}>
                <button 
                  type="submit"
                  className={cx('saveButton')}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
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
