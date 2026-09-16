import React from 'react';
import classNames from 'classnames/bind';
import * as styles from './ThemeToggle.module.scss';

const cx = classNames.bind(styles);

function ThemeToggle() {
    const toggleTheme = () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem('theme', next);
        } catch (e) {
        }
    };

    return (
        <button
            type="button"
            className={cx('theme-toggle')}
            onClick={toggleTheme}
            aria-label="Chuyển giữa giao diện sáng và tối"
            title="Chuyển giữa giao diện sáng và tối"
        >
            {/* Track 2 icon tĩnh: mặt trời (trái) | trăng (phải) —
                DOM order quyết định vị trí vì space-between. Knob absolute
                trượt đè icon theme đang bật; icon nằm TRÊN knob (z-index)
                nên theme đang bật hiện rõ trên nền knob. aria-hidden vì
                button đã có aria-label mô tả hành động. */}
            <span className={cx('knob')} aria-hidden="true"></span>
            <i className={`fas fa-sun ${cx('icon-sun')}`} aria-hidden="true"></i>
            <i className={`fas fa-moon ${cx('icon-moon')}`} aria-hidden="true"></i>
        </button>
    );
}

export default ThemeToggle;
