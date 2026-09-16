import React from 'react';
import * as styles from './Footer.module.scss';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Link, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const Footer = () => {
  const location = useLocation();
  const hideFooterPaths = ['/info', '/login'];

  if (hideFooterPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <footer className={cx('footer')}>
      <div className={cx('container')}>
        <div className={cx('footer-grid')}>
          <div className={cx('widget')}>
            <h3 className={cx('widget-title')}>Liên hệ</h3>
            <p className={cx('widget-text')}>
              Đừng bỏ lỡ bất kỳ cập nhật nào về các mẫu và sản phẩm mới của chúng tôi!
            </p>
            <form action="#" className={cx('subscribe')} method="post">
              <input
                type="text"
                name="EMAIL"
                className={cx('subscribe-input')}
                placeholder="Email của bạn"
              />
              <button className={cx('subscribe-btn')} type="submit">Đăng ký</button>
            </form>
          </div>

          <div className={cx('widget')}>
            <h3 className={cx('widget-title')}>Thành viên</h3>
            <ul className={cx('widget-list')}>
              <li><Link to="#">Nguyễn Trần Hữu Thắng</Link></li>
              <li><Link to="#">Nguyễn Văn Chương</Link></li>
              <li><Link to="#">Mai Lê Huy Hoàng</Link></li>
            </ul>
          </div>

          <div className={cx('widget')}>
            <h3 className={cx('widget-title')}>Trợ giúp</h3>
            <ul className={cx('widget-list')}>
              <li><Link to="#">FAQ</Link></li>
              <li><Link to="#">Term & Conditions</Link></li>
              <li><Link to="#">Reporting</Link></li>
              <li><Link to="#">Documentation</Link></li>
              <li><Link to="#">Support Policy</Link></li>
              <li><Link to="#">Privacy</Link></li>
            </ul>
          </div>

          <div className={cx('widget')}>
            <h3 className={cx('widget-title')}>Kết nối</h3>
            <div className={cx('social')}>
              <Link to="#" aria-label="Facebook"><i className="fab fa-facebook"></i></Link>
              <Link to="#" aria-label="GitHub"><i className="fab fa-github"></i></Link>
              <Link to="#" aria-label="YouTube"><i className="fab fa-youtube"></i></Link>
              <Link to="#" aria-label="Instagram"><i className="fab fa-instagram"></i></Link>
            </div>
          </div>
        </div>
      </div>

      <div className={cx('footer-bottom')}>
        <div className={cx('container')}>
          <p>© Nhóm 2</p>
          <p>Made by <Link to="#">SHOP Team2hand</Link></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
