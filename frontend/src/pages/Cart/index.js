import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as styles from './Cart.module.scss';
import classNames from 'classnames/bind';
import { showToast } from '../../components/Toast/index.js';
import Breadcrumb from '../../components/Breadcrumb/index.js';
import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

function Cart() {
    useHead('Túi mua sắm | Team2hand');
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [isApplying, setIsApplying] = useState(false);
    const [isPromoOpen, setIsPromoOpen] = useState(false);
    const navigate = useNavigate();

    const AVAILABLE_COUPONS = [
        { code: 'SALE10', name: 'Giảm 10%', type: 'percent', value: 10, desc: 'Chiết khấu 10% tổng đơn' },
        { code: 'SALE20', name: 'Giảm 20%', type: 'percent', value: 20, desc: 'Chiết khấu 20% tổng đơn' },
        { code: 'GIẢM50K', name: 'Giảm 50.000₫', type: 'fixed', value: 50000, desc: 'Khấu trừ trực tiếp 50.000 ₫' },
        { code: 'FREESHIP', name: 'Miễn phí vận chuyển', type: 'freeship', value: 0, desc: 'Miễn phí vận chuyển toàn quốc' }
    ];

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            try {
                const authResponse = await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (authResponse.data.success) {
                    setIsAuthenticated(true);
                    fetchCart(token);
                } else {
                    setIsAuthenticated(false);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Lỗi xác thực:', error);
                setIsAuthenticated(false);
                setLoading(false);
            }
        };

        checkAuth();

        const storedDiscount = localStorage.getItem('discount');
        if (storedDiscount) {
            try {
                const discountObj = JSON.parse(storedDiscount);
                setAppliedDiscount(discountObj);
                setCouponCode(localStorage.getItem('discountCode') || '');
                setIsPromoOpen(true);
            } catch (error) {
                console.error('Lỗi khi khôi phục thông tin giảm giá:', error);
            }
        }
    }, []);

    const fetchCart = async (token) => {
        try {
            const response = await axios.get(`${API_URL}/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });

            if (response.data.success && response.data.cart) {
                const formattedItems = (response.data.cart.items || []).map(item => ({
                    id: item._id,
                    productId: item.product?._id || item.product,
                    name: item.product?.name || 'Sản phẩm',
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    image: item.product?.images && item.product.images.length > 0
                        ? item.product.images[0].url
                        : 'https://via.placeholder.com/150',
                    stock: item.product?.stock ?? 99
                }));

                setCartItems(formattedItems);
            }
        } catch (error) {
            console.error('Lỗi khi lấy giỏ hàng:', error);
            showToast({
                title: 'Lỗi',
                message: 'Không thể lấy thông tin giỏ hàng',
                type: 'error',
                duration: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    async function handleQuantityChange(id, newQuantity) {
        const item = cartItems.find(item => item.id === id);

        if (newQuantity < 1) return;
        if (item && newQuantity > item.stock) {
            showToast({
                title: "Thông báo tồn kho",
                message: `Số lượng vượt quá tồn kho khả dụng (còn ${item.stock} sản phẩm).`,
                type: "warning",
                duration: 2500
            });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/cart/update`,
                {
                    itemId: id,
                    quantity: newQuantity
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
                setCartItems(prevItems =>
                    prevItems.map(item =>
                        item.id === id ? {...item, quantity: newQuantity} : item
                    )
                );

                window.dispatchEvent(new Event('cart-updated'));
            } else {
                showToast({
                    title: "Lỗi",
                    message: response.data.message || "Không thể cập nhật số lượng",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật giỏ hàng:', error);
            showToast({
                title: "Lỗi",
                message: "Đã xảy ra lỗi khi cập nhật giỏ hàng",
                type: "error",
                duration: 3000
            });
        }
    }

    async function handleRemoveItem(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_URL}/cart/remove/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                setCartItems(prevItems => prevItems.filter(item => item.id !== id));

                showToast({
                    title: "Đã xóa",
                    message: "Đã xóa sản phẩm khỏi giỏ hàng",
                    type: "success",
                    duration: 2000
                });

                window.dispatchEvent(new Event('cart-updated'));
            } else {
                showToast({
                    title: "Lỗi",
                    message: response.data.message || "Không thể xóa sản phẩm",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi xóa sản phẩm:', error);
            showToast({
                title: "Lỗi",
                message: "Đã xảy ra lỗi khi xóa sản phẩm",
                type: "error",
                duration: 3000
            });
        }
    }

    function calculateTotal() {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    const calculateDiscount = () => {
        if (!appliedDiscount) return 0;

        const subtotal = calculateTotal();

        if (appliedDiscount.type === 'percent') {
            return (subtotal * appliedDiscount.value) / 100;
        } else if (appliedDiscount.type === 'fixed') {
            return Math.min(appliedDiscount.value, subtotal);
        } else {
            return 0;
        }
    };

    const calculateFinalTotal = () => {
        const subtotal = calculateTotal();
        const discount = calculateDiscount();
        return Math.max(0, subtotal - discount);
    };

    const applyCouponLogic = (code) => {
        const cleanCode = (code || couponCode).trim().toUpperCase();
        if (!cleanCode) {
            showToast({
                title: "Thông báo",
                message: "Vui lòng nhập mã ưu đãi",
                type: "warning",
                duration: 2000
            });
            return;
        }

        setIsApplying(true);

        setTimeout(() => {
            const found = AVAILABLE_COUPONS.find(c => c.code === cleanCode);

            if (found) {
                setAppliedDiscount(found);
                setCouponCode(found.code);
                showToast({
                    title: "Đã áp dụng",
                    message: `Mã ${found.code}: ${found.desc}`,
                    type: "success",
                    duration: 3000
                });
            } else {
                setAppliedDiscount(null);
                showToast({
                    title: "Mã không hợp lệ",
                    message: "Mã ưu đãi không tồn tại hoặc đã hết hiệu lực",
                    type: "error",
                    duration: 3000
                });
            }

            setIsApplying(false);
        }, 300);
    };

    const handleApplyCoupon = () => {
        applyCouponLogic(couponCode);
    };

    const handleRemoveCoupon = () => {
        setAppliedDiscount(null);
        setCouponCode('');
        localStorage.removeItem('discount');
        localStorage.removeItem('discountAmount');
        localStorage.removeItem('discountType');
        localStorage.removeItem('discountValue');
        localStorage.removeItem('discountName');
        localStorage.removeItem('discountCode');
        showToast({
            title: "Đã gỡ",
            message: "Đã hủy mã ưu đãi",
            type: "info",
            duration: 2000
        });
    };

    function handleCheckout() {
        if (cartItems.length === 0) {
            showToast({
                title: "Giỏ hàng trống",
                message: "Vui lòng thêm sản phẩm vào túi trước khi thanh toán",
                type: "warning",
                duration: 2500
            });
            return;
        }

        if (appliedDiscount) {
            localStorage.setItem('discount', JSON.stringify(appliedDiscount));
            localStorage.setItem('discountAmount', calculateDiscount().toString());
            localStorage.setItem('discountType', appliedDiscount.type);
            localStorage.setItem('discountValue', appliedDiscount.value.toString());
            localStorage.setItem('discountName', appliedDiscount.name);
            localStorage.setItem('discountCode', appliedDiscount.code);
        } else {
            localStorage.removeItem('discount');
            localStorage.removeItem('discountAmount');
            localStorage.removeItem('discountType');
            localStorage.removeItem('discountValue');
            localStorage.removeItem('discountName');
            localStorage.removeItem('discountCode');
        }

        navigate('/checkout');
    }

    /* Render Loading State */
    if (loading) {
        return (
            <div className={cx('cartPage')}>
                <div className={cx('container')}>
                    <div className={cx('stateContainer')}>
                        <span className={cx('stateText')}>Đang tải giỏ hàng...</span>
                    </div>
                </div>
            </div>
        );
    }

    /* Render Login Required State */
    if (!isAuthenticated) {
        return (
            <div className={cx('cartPage')}>
                <div className={cx('container')}>
                    <div className={cx('stateContainer')}>
                        <span className={cx('stateIndex')}>01 / YÊU CẦU XÁC THỰC</span>
                        <h2 className={cx('stateTitle')}>ĐĂNG NHẬP ĐỂ XEM TÚI MUA SẮM</h2>
                        <p className={cx('stateDesc')}>
                            Vui lòng đăng nhập tài khoản của bạn để đồng bộ danh sách sản phẩm đã chọn và tiếp tục trải nghiệm mua sắm.
                        </p>
                        <button
                            type="button"
                            className={cx('primaryActionBtn')}
                            onClick={() => navigate('/login', { state: { from: { pathname: '/cart' } } })}
                        >
                            ĐĂNG NHẬP NGAY
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* Render Empty Cart State */
    if (cartItems.length === 0) {
        return (
            <div className={cx('cartPage')}>
                <div className={cx('container')}>
                    {/* Editorial Breadcrumb */}
                    <Breadcrumb
                        items={[
                            { label: 'Trang chủ', to: '/' },
                            { label: 'Giỏ hàng' }
                        ]}
                    />

                    <div className={cx('emptyStateCard')}>
                        <span className={cx('emptyMeta')}>BAG / EMPTY</span>
                        <h2 className={cx('emptyTitle')}>TÚI MUA SẮM HIỆN ĐANG TRỐNG</h2>
                        <p className={cx('emptyDesc')}>
                            Chưa có sản phẩm nào trong túi mua sắm của bạn. Khám phá ngay các thiết kế mới nhất từ bộ sưu tập cao cấp của chúng tôi.
                        </p>
                        <button
                            type="button"
                            className={cx('primaryActionBtn')}
                            onClick={() => navigate('/products')}
                        >
                            KHÁM PHÁ BỘ SƯU TẬP
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* Render Populated Cart */
    return (
        <div className={cx('cartPage')}>
            <div className={cx('container')}>
                {/* Editorial Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Giỏ hàng' }
                    ]}
                />

                {/* Page Header */}
                <div className={cx('pageHeader')}>
                    <div className={cx('titleWrap')}>
                        <h1 className={cx('pageTitle')}>TÚI MUA SẮM</h1>
                        <span className={cx('itemCountBadge')}>
                            {cartItems.length.toString().padStart(2, '0')} sản phẩm
                        </span>
                    </div>
                    <Link to="/products" className={cx('continueTopLink')}>
                        ← TIẾP TỤC CHỌN SẢN PHẨM
                    </Link>
                </div>

                {/* Main 2-Column Layout */}
                <div className={cx('layoutGrid')}>
                    {/* Left Column: Cart Items Manifest */}
                    <div className={cx('itemsColumn')}>
                        <div className={cx('manifestTable')}>
                            {/* Table Header */}
                            <div className={cx('manifestHeader')}>
                                <span className={cx('colProduct')}>SẢN PHẨM</span>
                                <span className={cx('colPrice')}>ĐƠN GIÁ</span>
                                <span className={cx('colQty')}>SỐ LƯỢNG</span>
                                <span className={cx('colTotal')}>THÀNH TIỀN</span>
                                <span className={cx('colAction')}></span>
                            </div>

                            {/* Item Rows */}
                            <div className={cx('manifestBody')}>
                                {cartItems.map((item) => {
                                    const isLowStock = item.stock <= 3 && item.stock > 0;
                                    return (
                                        <div key={item.id} className={cx('itemRow')}>
                                            {/* Product Details & Image */}
                                            <div className={cx('itemMain')}>
                                                <Link to={`/product/${item.productId}`} className={cx('imageFrame')}>
                                                    <img src={item.image} alt={item.name} loading="lazy" />
                                                </Link>
                                                <div className={cx('itemDetails')}>
                                                    <Link to={`/product/${item.productId}`} className={cx('itemName')}>
                                                        {item.name}
                                                    </Link>
                                                    {isLowStock && (
                                                        <span className={cx('stockWarning')}>
                                                            Chỉ còn {item.stock} sản phẩm
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Unit Price */}
                                            <div className={cx('unitPrice')}>
                                                {Number(item.price).toLocaleString('vi-VN')} ₫
                                            </div>

                                            {/* Typographic Stepper */}
                                            <div className={cx('stepperBox')}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    aria-label="Giảm số lượng"
                                                    className={cx('stepperBtn')}
                                                >
                                                    −
                                                </button>
                                                <span className={cx('stepperValue')}>{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.stock}
                                                    aria-label="Tăng số lượng"
                                                    className={cx('stepperBtn')}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Line Total */}
                                            <div className={cx('lineTotal')}>
                                                {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                            </div>

                                            {/* Remove Action */}
                                            <button
                                                type="button"
                                                className={cx('removeBtn')}
                                                onClick={() => handleRemoveItem(item.id)}
                                                title="Xóa sản phẩm khỏi giỏ hàng"
                                                aria-label="Xóa sản phẩm này"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>

                                            {/* Mobile Meta Row */}
                                            <div className={cx('mobileRowMeta')}>
                                                <div className={cx('mobilePriceDetail')}>
                                                    <span>Đơn giá: {Number(item.price).toLocaleString('vi-VN')} ₫</span>
                                                    <span>Tổng: {(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Manifest Bottom Bar */}
                            <div className={cx('manifestFooter')}>
                                <Link to="/products" className={cx('continueBottomLink')}>
                                    ← TIẾP TỤC CHỌN SẢN PHẨM KHÁC
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sticky Sidebar (Promo Accordion + Order Summary) */}
                    <aside className={cx('summaryColumn')}>
                        {/* Discreet Promo Code Accordion */}
                        <div className={cx('panelCard', 'promoPanel')}>
                            <button
                                type="button"
                                className={cx('promoToggleBtn')}
                                onClick={() => setIsPromoOpen(prev => !prev)}
                                aria-expanded={isPromoOpen}
                            >
                                <span className={cx('promoToggleLabel')}>MÃ ƯU ĐÃI (PROMO CODE)</span>
                                <span className={cx('promoToggleIcon')}>{isPromoOpen ? '−' : '+'}</span>
                            </button>

                            {isPromoOpen && (
                                <div className={cx('promoDropdown')}>
                                    <div className={cx('promoInputRow')}>
                                        <input
                                            type="text"
                                            placeholder="NHẬP MÃ ƯU ĐÃI"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleApplyCoupon();
                                                }
                                            }}
                                            disabled={isApplying || !!appliedDiscount}
                                            className={cx('promoInput')}
                                        />
                                        {appliedDiscount ? (
                                            <button
                                                type="button"
                                                className={cx('removePromoBtn')}
                                                onClick={handleRemoveCoupon}
                                                disabled={isApplying}
                                            >
                                                HỦY
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={cx('applyPromoBtn')}
                                                onClick={handleApplyCoupon}
                                                disabled={isApplying || !couponCode.trim()}
                                            >
                                                {isApplying ? '...' : 'ÁP DỤNG'}
                                            </button>
                                        )}
                                    </div>

                                    {appliedDiscount && (
                                        <div className={cx('appliedPromoReceipt')}>
                                            <div className={cx('appliedRow')}>
                                                <span className={cx('appliedName')}>{appliedDiscount.code} ({appliedDiscount.desc})</span>
                                                <span className={cx('appliedVal')}>
                                                    -{calculateDiscount().toLocaleString('vi-VN')} ₫
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Order Summary Manifest */}
                        <div className={cx('panelCard', 'summaryPanel')}>
                            <div className={cx('summaryHeader')}>
                                <span>TỔNG KẾT ĐƠN HÀNG</span>
                            </div>

                            <div className={cx('summaryRows')}>
                                <div className={cx('summaryRow')}>
                                    <span className={cx('rowLabel')}>TẠM TÍNH</span>
                                    <span className={cx('rowVal')}>{calculateTotal().toLocaleString('vi-VN')} ₫</span>
                                </div>

                                {appliedDiscount && (
                                    <div className={cx('summaryRow', 'discountRow')}>
                                        <span className={cx('rowLabel')}>CHIẾT KHẤU ({appliedDiscount.code})</span>
                                        <span className={cx('rowVal')}>-{calculateDiscount().toLocaleString('vi-VN')} ₫</span>
                                    </div>
                                )}

                                <div className={cx('summaryRow')}>
                                    <span className={cx('rowLabel')}>VẬN CHUYỂN TIÊU CHUẨN</span>
                                    <span className={cx('rowVal')}>MIỄN PHÍ</span>
                                </div>

                                <div className={cx('grandTotalRow')}>
                                    <span className={cx('totalLabel')}>TỔNG THANH TOÁN</span>
                                    <div className={cx('totalAmountWrap')}>
                                        <span className={cx('totalAmount')}>
                                            {calculateFinalTotal().toLocaleString('vi-VN')} ₫
                                        </span>
                                        <span className={cx('taxNote')}>ĐÃ BAO GỒM THUẾ VÀ PHÍ DỊCH VỤ</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className={cx('checkoutBtn')}
                                onClick={handleCheckout}
                            >
                                TIẾN HÀNH THANH TOÁN
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default Cart;
