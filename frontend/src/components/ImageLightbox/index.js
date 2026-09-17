import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';
import * as styles from './ImageLightbox.module.scss';

const cx = classNames.bind(styles);

function ImageLightbox({
    isOpen = false,
    onClose,
    images = [],
    initialIndex = 0,
    title = '',
    subtitle = '',
}) {
    // Chuẩn hoá mảng images thành mảng string URLs
    const normalizedImages = Array.isArray(images)
        ? images.map((item) => (typeof item === 'string' ? item : item?.url)).filter(Boolean)
        : [];

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

    // Cập nhật currentIndex khi initialIndex hoặc danh sách ảnh thay đổi
    useEffect(() => {
        if (isOpen) {
            const safeIndex = Math.max(0, Math.min(initialIndex, normalizedImages.length - 1));
            setCurrentIndex(safeIndex);
            setIsZoomed(false);
        }
    }, [isOpen, initialIndex, normalizedImages.length]);

    const handlePrev = useCallback(() => {
        if (normalizedImages.length <= 1) return;
        setIsZoomed(false);
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : normalizedImages.length - 1));
    }, [normalizedImages.length]);

    const handleNext = useCallback(() => {
        if (normalizedImages.length <= 1) return;
        setIsZoomed(false);
        setCurrentIndex((prev) => (prev < normalizedImages.length - 1 ? prev + 1 : 0));
    }, [normalizedImages.length]);

    // Xử lý phím tắt ESC, mũi tên Trái / Phải
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, handlePrev, handleNext]);

    if (!isOpen || normalizedImages.length === 0) return null;

    const currentUrl = normalizedImages[currentIndex] || '';
    const hasMultiple = normalizedImages.length > 1;

    const handleMouseMove = (e) => {
        if (!isZoomed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    const toggleZoom = () => {
        setIsZoomed((prev) => !prev);
    };

    const lightboxContent = (
        <div className={cx('lightbox-root')} role="dialog" aria-modal="true" aria-label="Xem ảnh phóng to">
            {/* Backdrop overlay mờ phía sau */}
            <div className={cx('backdrop')} onClick={onClose} aria-hidden="true" />

            {/* Header thanh công cụ trên cùng */}
            <header className={cx('header')}>
                <div className={cx('title-box')}>
                    {title && <h4 className={cx('title')}>{title}</h4>}
                    {subtitle && <p className={cx('subtitle')}>{subtitle}</p>}
                </div>

                <div className={cx('toolbar')}>
                    {hasMultiple && (
                        <span className={cx('counter-badge')}>
                            {currentIndex + 1} / {normalizedImages.length}
                        </span>
                    )}

                    {/* Nút phóng to / thu nhỏ */}
                    <button
                        type="button"
                        className={cx('tool-btn', { active: isZoomed })}
                        onClick={toggleZoom}
                        title={isZoomed ? 'Thu nhỏ về vừa màn hình' : 'Phóng to 200%'}
                        aria-label="Phóng to / Thu nhỏ"
                    >
                        <i className={`fas ${isZoomed ? 'fa-search-minus' : 'fa-search-plus'}`} />
                    </button>

                    {/* Nút mở ảnh gốc tab mới */}
                    <a
                        href={currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx('tool-btn')}
                        title="Mở ảnh gốc trong tab mới"
                        aria-label="Mở tab mới"
                    >
                        <i className="fas fa-external-link-alt" />
                    </a>

                    {/* Nút đóng */}
                    <button
                        type="button"
                        className={cx('close-btn')}
                        onClick={onClose}
                        title="Đóng (Esc)"
                        aria-label="Đóng"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>
            </header>

            {/* Vùng hiển thị ảnh chính */}
            <main className={cx('stage')}>
                {hasMultiple && (
                    <button
                        type="button"
                        className={cx('nav-btn', 'prev-btn')}
                        onClick={handlePrev}
                        aria-label="Ảnh trước"
                        title="Ảnh trước (Mũi tên trái)"
                    >
                        <i className="fas fa-chevron-left" />
                    </button>
                )}

                <div
                    className={cx('image-container', { zoomed: isZoomed })}
                    onClick={toggleZoom}
                    onMouseMove={handleMouseMove}
                    title={isZoomed ? 'Ấn để thu nhỏ' : 'Ấn để phóng to'}
                >
                    <img
                        key={currentUrl}
                        src={currentUrl}
                        alt={title || `Ảnh sản phẩm ${currentIndex + 1}`}
                        className={cx('main-image')}
                        style={
                            isZoomed
                                ? {
                                      transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                                  }
                                : undefined
                        }
                    />
                </div>

                {hasMultiple && (
                    <button
                        type="button"
                        className={cx('nav-btn', 'next-btn')}
                        onClick={handleNext}
                        aria-label="Ảnh tiếp theo"
                        title="Ảnh sau (Mũi tên phải)"
                    >
                        <i className="fas fa-chevron-right" />
                    </button>
                )}
            </main>

            {/* Dải thumbnail xem nhanh phía dưới khi có nhiều ảnh */}
            {hasMultiple && (
                <footer className={cx('thumbnails-bar')}>
                    <div className={cx('thumbnails-scroll')}>
                        {normalizedImages.map((thumbUrl, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={cx('thumb-item', { active: idx === currentIndex })}
                                onClick={() => {
                                    setIsZoomed(false);
                                    setCurrentIndex(idx);
                                }}
                                aria-label={`Xem ảnh ${idx + 1}`}
                            >
                                <img src={thumbUrl} alt={`Ảnh nhỏ ${idx + 1}`} />
                            </button>
                        ))}
                    </div>
                </footer>
            )}
        </div>
    );

    return createPortal(lightboxContent, document.body);
}

export default ImageLightbox;
