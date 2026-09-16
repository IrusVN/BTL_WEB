import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import * as styles from './ProductDetail.module.scss';
import { showToast } from '../../components/Toast/index.js';
import { API_URL } from '../../services/authService.js';
import { useHead } from '../../hooks/useHead.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [slideDirection, setSlideDirection] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    useHead(product ? product.name : 'Chi tiết sản phẩm');
    const [touchEnd, setTouchEnd] = useState(null);
    
    const minSwipeDistance = 50;
    
    const openModal = () => {
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
        setIsModalOpen(false);
        document.body.style.overflow = '';
    };
    const extraInfoRef = useRef(null);
    const commentRef = useRef(null);
    const similarProductsRef = useRef(null);
    const autoSlideInterval = useRef(null);
    const topRef = useRef(null);

    const handleSimilarProductClick = (e, productId) => {
        e.preventDefault();
        
        document.body.classList.add('scroll-up-animation');
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            navigate(`/product/${productId}`);
            
            setTimeout(() => {
                document.body.classList.remove('scroll-up-animation');
            }, 100);
        }, 600);
    };

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' 
        });
    }, [id]);

    const toggleExpanded = () => {
        setExpanded((prev) => {
            const newState = !prev;

            setTimeout(() => {
                if (extraInfoRef.current) {
                    extraInfoRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: newState ? 'start' : 'start',
                    });
                }
            }, 300);

            return newState;
        });
    };
    
    const handleThumbnailClick = (index) => {
        setMainImageIndex(index);
    };

    const handleNextImage = () => {
        setMainImageIndex((prev) => (prev + 1) % product.images.length);
    };

    const handlePrevImage = () => {
        setMainImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    };
    
    const handleNextSlide = useCallback(() => {
        if (!similarProducts || similarProducts.length <= 5 || isAnimating) return;
        
        setSlideDirection('next');
        setIsAnimating(true);
        
        setTimeout(() => {
            setCurrentSlide((prev) => {
                const next = prev + 1;
                return next >= similarProducts.length - 4 ? 0 : next;
            });
            
            setTimeout(() => {
                setIsAnimating(false);
            }, 300);
        }, 50);
    }, [similarProducts, isAnimating]);
    
    const handlePrevSlide = useCallback(() => {
        if (!similarProducts || similarProducts.length <= 5 || isAnimating) return;
        
        setSlideDirection('prev');
        setIsAnimating(true);
        
        setTimeout(() => {
            setCurrentSlide((prev) => {
                const next = prev - 1;
                return next < 0 ? similarProducts.length - 5 : next;
            });
            
            setTimeout(() => {
                setIsAnimating(false);
            }, 300);
        }, 50);
    }, [similarProducts, isAnimating]);
    
    useEffect(() => {
        if (autoSlideInterval.current) {
            clearInterval(autoSlideInterval.current);
            autoSlideInterval.current = null;
        }
        
        if (similarProducts && similarProducts.length > 5) {
            autoSlideInterval.current = setInterval(() => {
                handleNextSlide();
            }, 5000);
        }
        
        return () => {
            if (autoSlideInterval.current) {
                clearInterval(autoSlideInterval.current);
                autoSlideInterval.current = null;
            }
        };
    }, [similarProducts, handleNextSlide]);
    
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (autoSlideInterval.current) {
                    clearInterval(autoSlideInterval.current);
                    autoSlideInterval.current = null;
                }
            } else if (similarProducts && similarProducts.length > 5) {
                if (autoSlideInterval.current) {
                    clearInterval(autoSlideInterval.current);
                }
                autoSlideInterval.current = setInterval(handleNextSlide, 5000);
            }
        };
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [similarProducts, handleNextSlide]);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setLoading(false);
                showToast({
                    title: 'Lỗi',
                    message: 'Không tìm thấy sản phẩm',
                    type: 'error',
                });
                navigate('/products');
                return;
            }
            
            try {
                const response = await axios.get(`${API_URL}/products/product/${id}`);
                if (response.data.success) {
                    setProduct(response.data.product);
                    
                    if (response.data.product && response.data.product.category) {
                        fetchSimilarProducts(response.data.product.category);
                    }
                } else {
                    showToast({
                        title: 'Lỗi',
                        message: 'Không thể tải thông tin sản phẩm',
                        type: 'error',
                    });
                }
            } catch (error) {
                showToast({
                    title: 'Lỗi',
                    message: 'Đã xảy ra lỗi khi tải sản phẩm',
                    type: 'error',
                });
            } finally {
                setLoading(false);
            }
        };

        const fetchSimilarProducts = async (categoryId) => {
            if (!categoryId) return;
            
            try {
                console.log(`Đang tải sản phẩm tương tự cho danh mục: ${categoryId}`);
                const response = await axios.get(`${API_URL}/products/category/${encodeURIComponent(categoryId)}`);
                if (response.data.success) {
                    const filtered = response.data.products
                        .filter(prod => prod._id !== id)
                        .slice(0, 10);
                    
                    console.log(`Đã tìm thấy ${filtered.length} sản phẩm tương tự`);
                    setSimilarProducts(filtered);
                }
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm tương tự:', error);
            }
        };

        fetchProduct();
        
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        setIsAuthenticated(true);
                        if (res.data.user && res.data.user.role === 'admin') {
                            setIsAdmin(true);
                        }
                    }
                } catch (error) {
                    console.error('Lỗi xác thực:', error);
                }
            }
        };
        
        checkAuth();
        
        return () => {
            if (autoSlideInterval.current) {
                clearInterval(autoSlideInterval.current);
                autoSlideInterval.current = null;
            }
        };
    }, [id, navigate]);
    
    useEffect(() => {
        const fetchComments = async () => {
            if (!id) return;
            
            setIsLoadingComments(true);
            try {
                const response = await axios.get(`${API_URL}/comments/product/${id}`);
                if (response.data.success) {
                    setComments(response.data.comments);
                }
            } catch (error) {
                console.error('Lỗi khi lấy bình luận:', error);
            } finally {
                setIsLoadingComments(false);
            }
        };
        
        fetchComments();
    }, [id]);

    const handleQuantityChange = (value) => {
        const newQuantity = quantity + value;
        if (newQuantity > 0 && newQuantity <= (product?.stock || 1)) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = async () => {
        try {
            if (!isAuthenticated) {
                showToast({
                    title: 'Lỗi',
                    message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng',
                    type: 'error',
                });
                return;
            }

            if (quantity <= 0 || quantity > product.stock) {
                showToast({
                    title: 'Lỗi',
                    message: 'Số lượng không hợp lệ',
                    type: 'error',
                });
                return;
            }

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/cart/add`,
                { 
                    productId: id, 
                    quantity: quantity 
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                showToast({
                    title: 'Thành công',
                    message: 'Đã thêm sản phẩm vào giỏ hàng',
                    type: 'success',
                });
                
                window.dispatchEvent(new Event('cart-updated'));
            } else {
                showToast({
                    title: 'Lỗi',
                    message: response.data.message || 'Không thể thêm vào giỏ hàng',
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('Lỗi khi thêm vào giỏ hàng:', error);
            
            if (error.response) {
                const errorMessage = error.response.data.message || 'Đã xảy ra lỗi khi thêm vào giỏ hàng';
                showToast({
                    title: 'Lỗi',
                    message: errorMessage,
                    type: 'error',
                });
            } else if (error.request) {
                showToast({
                    title: 'Lỗi kết nối',
                    message: 'Không thể kết nối đến máy chủ',
                    type: 'error',
                });
            } else {
                showToast({
                    title: 'Lỗi',
                    message: 'Đã xảy ra lỗi khi thêm vào giỏ hàng',
                    type: 'error',
                });
            }
        }
    };
    
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        
        if (!newComment.trim()) {
            showToast({
                title: 'Lỗi',
                message: 'Vui lòng nhập nội dung bình luận',
                type: 'error',
            });
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/comments/product/${id}`,
                { content: newComment, rating },
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            
            if (response.data.success) {
                setComments([response.data.comment, ...comments]);
                setNewComment('');
                setRating(5);
                
                showToast({
                    title: 'Thành công',
                    message: 'Đã thêm bình luận thành công',
                    type: 'success',
                });
            }
        } catch (error) {
            console.error('Lỗi khi thêm bình luận:', error);
            showToast({
                title: 'Lỗi',
                message: error.response?.data?.message || 'Đã xảy ra lỗi khi thêm bình luận',
                type: 'error',
            });
        }
    };
    
    const handleDeleteComment = async (commentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_URL}/comments/${commentId}`,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    },
                    withCredentials: true
                }
            );
            
            if (response.data.success) {
                setComments(comments.filter(comment => comment._id !== commentId));
                
                showToast({
                    title: 'Thành công',
                    message: 'Đã xóa bình luận thành công',
                    type: 'success',
                });
            }
        } catch (error) {
            console.error('Lỗi khi xóa bình luận:', error);
            showToast({
                title: 'Lỗi',
                message: error.response?.data?.message || 'Đã xảy ra lỗi khi xóa bình luận',
                type: 'error',
            });
        }
    };

    useEffect(() => {
        if (isModalOpen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        
        return () => {
            document.body.classList.remove('body-no-scroll');
        };
    }, [isModalOpen]);

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    
    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };
    
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isSwipe = Math.abs(distance) > minSwipeDistance;
        
        if (isSwipe) {
            if (distance > 0) {
                handleNextImage();
            } else {
                handlePrevImage();
            }
        }
    };

    if (loading) {
        return <div className={cx('loading')}>Đang tải...</div>;
    }

    if (!product) {
        return <div className={cx('error')}>Không tìm thấy sản phẩm</div>;
    }

    const visibleSimilarProducts = !similarProducts || similarProducts.length <= 5 
        ? similarProducts 
        : similarProducts.slice(currentSlide, currentSlide + 5).length === 5 
            ? similarProducts.slice(currentSlide, currentSlide + 5)
            : [...similarProducts.slice(currentSlide), ...similarProducts.slice(0, 5 - (similarProducts.length - currentSlide))];

    return (
        <div className={cx('product-detail')} ref={topRef}>
            <div className={cx('breadcrumb')}>
                <Link to="/">Trang chủ</Link>
                <FontAwesomeIcon icon={faChevronRight} className={cx('breadcrumb-sep')} />
                <Link to="/products">Sản phẩm</Link>
                <FontAwesomeIcon icon={faChevronRight} className={cx('breadcrumb-sep')} />
                <span>{product.name.length > 40 ? product.name.slice(0, 40) + '…' : product.name}</span>
            </div>
            <div className={cx('product-container')}>
                <div className={cx('product-images')}>
                    <div
                        className={cx('main-image')}
                        onClick={openModal}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <img
                            src={product.images[mainImageIndex]?.url || 'https://via.placeholder.com/400'}
                            alt={product.name}
                        />
                        <button
                            className={cx('nav-btn', 'left')}
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrevImage();
                            }}
                            aria-label="Ảnh trước"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button
                            className={cx('nav-btn', 'right')}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNextImage();
                            }}
                            aria-label="Ảnh sau"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>

                    <div className={cx('thumbnail-list')}>
                        {product.images.map((image, index) => (
                            <div
                                key={index}
                                className={cx('thumbnail', { active: index === mainImageIndex })}
                                onClick={() => handleThumbnailClick(index)}
                            >
                                <img src={image.url} alt={`${product.name} ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className={cx('product-info')}>
                    <h1 className={cx('product-name')}>{product.name}</h1>
                    <div className={cx('product-price')}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                    </div>
                    <div className={cx('product-description')}>
                        <h3>Mô tả sản phẩm</h3>
                        <p>{product.description}</p>
                    </div>
                    <div className={cx('product-quantity')}>
                        <h3>Số lượng</h3>
                        <div className={cx('quantity-control')}>
                            <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} aria-label="Giảm số lượng">
                                −
                            </button>
                            <span>{quantity}</span>
                            <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock} aria-label="Tăng số lượng">
                                +
                            </button>
                        </div>
                    </div>
                    <button className={cx('add-to-cart')} onClick={handleAddToCart}>
                        Thêm vào giỏ hàng
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <div 
                    className={cx('image-modal')} 
                    onClick={closeModal}
                >
                    <img 
                        src={product.images[mainImageIndex]?.url} 
                        alt={product.name} 
                        className={cx('modal-image')} 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            <div className={cx('extra-info-wrapper')}>
                <h3 className={cx('extra-info-title')}>Thông tin bổ sung</h3>

                <div className={cx('extra-info', { expanded })} style={{ maxHeight: expanded ? '1000px' : '160px' }} ref={extraInfoRef}>
                    <table className={cx('info-table')}>
                        <tbody>
                            <tr>
                                <td>Thương Hiệu</td>
                                <td>{product.brand}</td>
                            </tr>
                            <tr>
                                <td>Xuất Xứ</td>
                                <td>{product.xuatXu}</td>
                            </tr>
                            <tr>
                                <td>Giới Tính</td>
                                <td>{product.gioiTinh}</td>
                            </tr>
                            <tr>
                                <td>Màu Sắc</td>
                                <td>{product.mauSac}</td>
                            </tr>
                            <tr>
                                <td>Kiểu Dáng</td>
                                <td>{product.kieuDang}</td>
                            </tr>
                            <tr>
                                <td>Chất Liệu</td>
                                <td>{product.chatLieu}</td>
                            </tr>
                            <tr>
                                <td>Size</td>
                                <td>{product.size}</td>
                            </tr>
                             
                        </tbody>
                    </table>

                    {!expanded && <div className={cx('info-blur')} />}
                </div>

                <button className={cx('toggle-btn')} onClick={toggleExpanded}>
                    {expanded ? 'Thu gọn ▲' : 'Xem thêm ▼'}
                </button>
            </div>
            
            {/* Phần bình luận sản phẩm */}
            <div className={cx('comments-section')} ref={commentRef}>
                <h3 className={cx('comments-title')}>Bình luận sản phẩm</h3>
                
                {/* Form nhập bình luận - chỉ hiển thị khi đã đăng nhập */}
                {isAuthenticated ? (
                    <form className={cx('comment-form')} onSubmit={handleSubmitComment}>
                        <div className={cx('rating-control')}>
                            <span>Đánh giá:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span 
                                    key={star}
                                    className={cx('star', { active: star <= rating })}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Viết bình luận của bạn..."
                            className={cx('comment-input')}
                            rows={4}
                        />
                        <button type="submit" className={cx('submit-comment')}>
                            Gửi bình luận
                        </button>
                    </form>
                ) : (
                    <div className={cx('login-prompt')}>
                        <p>Vui lòng đăng nhập để viết bình luận</p>
                    </div>
                )}
                
                {/* Danh sách bình luận */}
                <div className={cx('comments-list')}>
                    {isLoadingComments ? (
                        <div className={cx('comments-loading')}>Đang tải bình luận...</div>
                    ) : comments.length > 0 ? (
                        comments.map((comment) => (
                            <div key={comment._id} className={cx('comment-item')}>
                                <div className={cx('comment-header')}>
                                    <div className={cx('user-info')}>
                                        <div className={cx('avatar')}>
                                            {comment.user.avatar ? (
                                                <img src={comment.user.avatar} alt={comment.user.name} />
                                            ) : (
                                                <div className={cx('avatar-placeholder')}>
                                                    {comment.user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className={cx('username')}>{comment.user.name}</span>
                                    </div>
                                    <div className={cx('comment-rating')}>
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <span key={index} className={cx('star', { filled: index < comment.rating })}>
                                                ★
                                            </span>
                                        ))}
                                        <span className={cx('comment-date')}>
                                            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                                <div className={cx('comment-content')}>{comment.content}</div>
                                
                                {/* Nút xóa comment - chỉ hiển thị với admin */}
                                {isAdmin && (
                                    <div className={cx('comment-actions')}>
                                        <button 
                                            className={cx('delete-comment')}
                                            onClick={() => handleDeleteComment(comment._id)}
                                        >
                                            Xóa bình luận
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className={cx('no-comments')}>Chưa có bình luận nào cho sản phẩm này</div>
                    )}
                </div>
            </div>
            
            {/* Phần sản phẩm tương tự */}
            {similarProducts && similarProducts.length > 0 && (
                <div className={cx('similar-products-section')} ref={similarProductsRef}>
                    <h3 className={cx('section-title')}>Sản phẩm tương tự</h3>
                    
                    <div className={cx('similar-products-container')}>
                        {similarProducts.length > 5 && (
                            <button
                                className={cx('similar-nav-btn', 'left')}
                                onClick={handlePrevSlide}
                                disabled={isAnimating}
                                aria-label="Sản phẩm trước"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                        )}
                        
                        <div 
                            className={cx('similar-products-list', {
                                'slide-next': slideDirection === 'next' && isAnimating,
                                'slide-prev': slideDirection === 'prev' && isAnimating,
                            })}
                        >
                            
                            {visibleSimilarProducts && visibleSimilarProducts.map(similarProduct => (
                                <div
                                    className={cx('similar-product-item')} 
                                    key={similarProduct._id}
                                    onClick={(e) => handleSimilarProductClick(e, similarProduct._id)}
                                >
                                    <div className={cx('similar-product-image')}>
                                        <img 
                                            src={similarProduct.images[0]?.url || 'https://via.placeholder.com/200'} 
                                            alt={similarProduct.name} 
                                        />
                                    </div>
                                    <div className={cx('similar-product-info')}>
                                        <h4 className={cx('similar-product-name')}>{similarProduct.name}</h4>
                                        <div className={cx('similar-product-price')}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(similarProduct.price)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {similarProducts.length > 5 && (
                            <button
                                className={cx('similar-nav-btn', 'right')}
                                onClick={handleNextSlide}
                                disabled={isAnimating}
                                aria-label="Sản phẩm sau"
                            >
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductDetail;
