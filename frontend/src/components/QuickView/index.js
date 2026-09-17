import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';
import * as styles from './QuickView.module.scss';

const cx = classNames.bind(styles);

function QuickView({
    isOpen = false,
    onClose,
    title,
    subtitle,
    extraHeader,
    children,
    footer,
    width = '560px',
    className,
    showCloseButton = true,
}) {
    // Đóng bằng phím Escape & khóa cuộn trang khi mở
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const quickViewElement = (
        <div className={cx('quickview-root', className)}>
            {/* Backdrop overlay mờ phía sau */}
            <div
                className={cx('backdrop')}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel chính: Desktop trượt từ phải sang trái, Mobile trượt từ dưới lên */}
            <aside
                className={cx('panel')}
                style={{ '--panel-width': width }}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === 'string' ? title : 'Bảng điều khiển nhanh'}
            >
                {/* Thanh kéo handle cho mobile BottomSheet */}
                <div className={cx('drag-handle')} onClick={onClose}>
                    <span className={cx('handle-bar')} />
                </div>

                {/* Header panel */}
                <div className={cx('header')}>
                    <div className={cx('header-info')}>
                        {title && <h3 className={cx('title')}>{title}</h3>}
                        {subtitle && <p className={cx('subtitle')}>{subtitle}</p>}
                    </div>

                    <div className={cx('header-actions')}>
                        {extraHeader}
                        {showCloseButton && (
                            <button
                                type="button"
                                className={cx('close-btn')}
                                onClick={onClose}
                                aria-label="Đóng bảng"
                            >
                                <i className="fas fa-times" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Nội dung cuộn chính */}
                <div className={cx('body')}>
                    {children}
                </div>

                {/* Footer sticky nếu có */}
                {footer && (
                    <div className={cx('footer')}>
                        {footer}
                    </div>
                )}
            </aside>
        </div>
    );

    return createPortal(quickViewElement, document.body);
}

export default QuickView;
