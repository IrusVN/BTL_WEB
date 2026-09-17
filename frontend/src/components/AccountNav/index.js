import React from 'react';
import { NavLink } from 'react-router-dom';
import * as styles from './AccountNav.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const NAV_ITEMS = [
    { label: 'Hồ sơ cá nhân', to: '/profile', icon: 'far fa-user' },
    { label: 'Đơn hàng của tôi', to: '/my-orders', icon: 'fas fa-box-open' },
    { label: 'Đổi mật khẩu', to: '/change-password', icon: 'fas fa-key' },
    { label: 'Cài đặt', to: '/settings', icon: 'fas fa-sliders-h' }
];

const AccountNav = () => {
    return (
        <nav className={cx('accountNav')} aria-label="Điều hướng tài khoản">
            <div className={cx('navList')}>
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => cx('navTab', { active: isActive })}
                    >
                        <i className={cx('tabIcon', item.icon)} aria-hidden="true"></i>
                        <span className={cx('tabLabel')}>{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default AccountNav;
