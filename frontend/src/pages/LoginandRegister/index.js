import React, { useState, useEffect, useRef } from 'react';
import useLoginAndRegisterLogic from './LoginandRegister.js';
import * as styles from './LoginandRegister.module.scss';
import classNames from 'classnames/bind';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { register, login, forgotPassword, resetPassword } from '../../services/authService.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { showToast } from '../../components/Toast/index.js';
import bcrypt from 'bcryptjs';
import { useHead } from '../../hooks/useHead.js';
import { useMouseParallax } from '../../hooks/useMouseParallax.js';

const cx = classNames.bind(styles);

function LoginAndRegister() {
    useHead('Đăng nhập & Đăng ký');
  const { isSignUpActive, toggleToSignUp, toggleToSignIn } = useLoginAndRegisterLogic();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin, user } = useAuth();

  const wrapperRef = useRef(null);
  useMouseParallax(wrapperRef);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [adminRequired, setAdminRequired] = useState(false);

  const [authView, setAuthView] = useState('auth');
  const [resetToken, setResetToken] = useState('');
  const [resetData, setResetData] = useState({ password: '', confirmPassword: '' });
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const action = searchParams.get('action');
    const adminReq = searchParams.get('adminRequired');

    if (action === 'register') {
      toggleToSignUp();
      setAuthView('auth');
    } else if (action === 'forgotpassword') {
      toggleToSignIn();
      setError('');
      const token = searchParams.get('token');
      setResetToken(token || '');
      setAuthView(token ? 'reset' : 'forgot');
      setForgotSent(false);
    } else {
      toggleToSignIn();
      setAuthView('auth');
    }

    if (adminReq === 'true') {
      setAdminRequired(true);
      if (user && user.role !== 'admin') {
        setError('Bạn cần đăng nhập bằng tài khoản có quyền admin để truy cập trang này');
        showToast({
          title: "Yêu cầu quyền Admin",
          message: "Bạn cần đăng nhập bằng tài khoản có quyền admin để truy cập trang này",
          type: "warning",
          duration: 5000
        });
      }
    } else {
      setAdminRequired(false);
    }
  }, [location, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await forgotPassword(formData.email);
      setError('');
      setForgotSent(true);
      showToast({
        title: 'Đã gửi!',
        message: response.message,
        type: 'success',
        duration: 4000
      });
    } catch (error) {
      setError(error.message || 'Không thể gửi email đặt lại mật khẩu');
      showToast({
        title: 'Lỗi!',
        message: error.message || 'Không thể gửi email đặt lại mật khẩu',
        type: 'error',
        duration: 3000
      });
    }
  };

  const handleResetChange = (e) => {
    setResetData({
      ...resetData,
      [e.target.name]: e.target.value
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetData.password !== resetData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }
    try {
      const response = await resetPassword(resetToken, resetData.password, resetData.confirmPassword);
      setError('');
      setResetData({ password: '', confirmPassword: '' });
      setResetToken('');
      showToast({
        title: 'Thành công!',
        message: `${response.message}. Hãy đăng nhập với mật khẩu mới.`,
        type: 'success',
        duration: 5000
      });
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Đặt lại mật khẩu thất bại');
      showToast({
        title: 'Lỗi!',
        message: error.message || 'Đặt lại mật khẩu thất bại',
        type: 'error',
        duration: 3000
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await register(formData);
      if (response.success) {
        showToast({
          title: "Thành công!",
          message: "Đăng ký tài khoản thành công! Vui lòng đăng nhập.",
          type: "success",
          duration: 3000
        });
        setError('');
        authLogin(response.user, response.token);

        if (response.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setError(error.message || 'Đăng ký thất bại');
      showToast({
        title: "Lỗi!",
        message: error.message || 'Đăng ký thất bại',
        type: "error",
        duration: 3000
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await login({
        email: formData.email,
        password: formData.password
      });
      if (response.success) {
        if (adminRequired && response.user.role !== 'admin') {
          setError('Tài khoản của bạn không có quyền admin. Vui lòng đăng nhập với tài khoản admin.');
          showToast({
            title: "Không có quyền",
            message: "Tài khoản của bạn không có quyền admin. Vui lòng đăng nhập với tài khoản admin.",
            type: "error",
            duration: 4000
          });
          return;
        }

        showToast({
          title: "Thành công!",
          message: "Đăng nhập thành công!",
          type: "success",
          duration: 3000
        });
        authLogin(response.user, response.token);

        const fromPage = location.state?.from?.pathname || '/';
        if (response.user.role === 'admin') {
          navigate(fromPage === '/admin' ? '/admin' : '/admin');
        } else {
          navigate(fromPage === '/admin' ? '/' : fromPage);
        }
      }
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại');
      showToast({
        title: "Lỗi!",
        message: error.message || 'Đăng nhập thất bại',
        type: "error",
        duration: 3000
      });
    }
  };

  return (
    <div className={cx('wrapper')} ref={wrapperRef}>
      {/* Tầng sao mịn hậu cảnh — 2 tầng kia là pseudo của wrapper (§4.14) */}
      <div className={cx('stars-far')} aria-hidden="true" />
      {/* Orbs gradient trôi — nền sống động cho light theme (dark dùng tầng
          sao ở trên). Trang trí thuần CSS, không tương tác — aria-hidden */}
      <div className={cx('orbs')} aria-hidden="true">
        <span className={cx('orb', 'orb-violet')} />
        <span className={cx('orb', 'orb-amber')} />
        <span className={cx('orb', 'orb-blue')} />
      </div>
      <div className={cx('container', { active: isSignUpActive })} id="container">
        {/* Segmented tabs — chỉ mobile; gọi lại 2 handler toggle cũ.
            Đang ở chế độ quên/đặt lại mật khẩu thì tab thoát về view thật
            (useEffect đọc URL sẽ set lại cả authView lẫn toggle) */}
        <div className={cx('auth-tabs')}>
          <button
            type="button"
            className={cx('auth-tab', { active: !isSignUpActive })}
            onClick={() => (authView === 'auth' ? toggleToSignIn() : navigate('/login'))}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={cx('auth-tab', { active: isSignUpActive })}
            onClick={() => (authView === 'auth' ? toggleToSignUp() : navigate('/login?action=register'))}
          >
            Đăng ký
          </button>
        </div>

        {/* Sign Up Form */}
        <div className={cx('form-container', 'sign-up', { hidden: !isSignUpActive })}>
          <form onSubmit={handleRegister}>
            <h1>Tạo tài khoản</h1>
            <div className={styles['social-icons']}>
              <a href="#" className="icon">
                <i className="fa-brands fa-google-plus-g"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-github"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-linkedin-in"></i>
              </a>
            </div>
            <span>hoặc sử dụng email để đăng ký</span>
            {error && (
              <div className={cx('error-banner')} role="alert">
                <i className="fas fa-circle-exclamation"></i>
                {error}
              </div>
            )}
            {adminRequired && (
              <div className={cx('admin-note')}>
                <i className="fas fa-shield-halved"></i>
                Cần tài khoản admin để truy cập trang Admin
              </div>
            )}
            <input
              type="text"
              name="name"
              placeholder="Tên của bạn"
              value={formData.name}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
            />
            <button type="submit">Đăng ký</button>
          </form>
        </div>

        {/* Sign In Form — cũng là chỗ form Quên / Đặt lại mật khẩu hiện ra
            (?action=forgotpassword): thay nội dung form đăng nhập ở nửa trái,
            khung mời đăng ký bên phải (toggle panel) giữ nguyên */}
        <div className={cx('form-container', 'sign-in', { hidden: isSignUpActive })}>
          {authView === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <h1>Quên mật khẩu?</h1>
              <p>Nhập email tài khoản của bạn — chúng tôi sẽ gửi link đặt lại mật khẩu (hiệu lực 15 phút).</p>
              {error && (
                <div className={cx('error-banner')} role="alert">
                  <i className="fas fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
              {forgotSent && (
                <div className={cx('sent-note')}>
                  <i className="fas fa-envelope-circle-check"></i>
                  <span className={cx('sent-note-body')}>
                    <b className={cx('sent-email')}>{formData.email}</b>
                    <span className={cx('sent-hint')}>Hãy kiểm tra hộp thư (kể cả Spam).</span>
                  </span>
                </div>
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              <button type="submit">Gửi link đặt lại</button>
              <button
                type="button"
                className={cx('back-link')}
                onClick={() => {
                  setError('');
                  navigate('/login');
                }}
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          )}
          {authView === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <h1>Đặt lại mật khẩu</h1>
              <p>Nhập mật khẩu mới cho tài khoản của bạn theo hướng dẫn trong email.</p>
              {error && (
                <div className={cx('error-banner')} role="alert">
                  <i className="fas fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                value={resetData.password}
                onChange={handleResetChange}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu mới"
                value={resetData.confirmPassword}
                onChange={handleResetChange}
              />
              <button type="submit">Đặt lại mật khẩu</button>
              <button
                type="button"
                className={cx('back-link')}
                onClick={() => {
                  setError('');
                  navigate('/login?action=forgotpassword');
                }}
              >
                ← Gửi lại link đặt lại
              </button>
            </form>
          )}
          {authView === 'auth' && (
          <form onSubmit={handleLogin}>
            <h1>Đăng nhập</h1>
            <div className={styles['social-icons']}>
              <a href="#" className="icon">
                <i className="fa-brands fa-google-plus-g"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-github"></i>
              </a>
              <a href="#" className="icon">
                <i className="fa-brands fa-linkedin-in"></i>
              </a>
            </div>
            <span>hoặc sử dụng email và mật khẩu</span>
            {error && (
              <div className={cx('error-banner')} role="alert">
                <i className="fas fa-circle-exclamation"></i>
                {error}
              </div>
            )}
            {adminRequired && (
              <div className={cx('admin-note')}>
                <i className="fas fa-shield-halved"></i>
                Cần tài khoản admin để truy cập trang Admin
              </div>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
            />
            <a
              href="/login?action=forgotpassword"
              className={cx('forgot-link')}
              onClick={(e) => {
                e.preventDefault();
                navigate('/login?action=forgotpassword');
              }}
            >
              Quên mật khẩu?
            </a>
            <button type="submit">Đăng nhập</button>
          </form>
          )}
        </div>

        {/* Toggle Panel */}
        <div className={styles['toggle-container']}>
          <div className={styles.toggle}>
            <div className={cx('toggle-panel', 'toggle-left')}>
              <div className={cx('brand-mark')}>Team2hand</div>
              <h2>Chào mừng trở lại!</h2>
              <p>Đăng nhập với thông tin cá nhân để sử dụng đầy đủ tính năng của Team2hand</p>
              <button
                className={styles.hidden}
                onClick={() => (authView === 'auth' ? toggleToSignIn() : navigate('/login'))}
              >
                Đăng nhập
              </button>
            </div>
            <div className={cx('toggle-panel', 'toggle-right')}>
              <div className={cx('brand-mark')}>Team2hand</div>
              <h2>Xin chào!</h2>
              <p>Đăng ký tài khoản để theo dõi đơn hàng và mua sắm dễ dàng hơn</p>
              <button
                className={styles.hidden}
                onClick={() => (authView === 'auth' ? toggleToSignUp() : navigate('/login?action=register'))}
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginAndRegister;
