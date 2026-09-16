import React, { useState, useEffect } from 'react';
import * as styles from './Cart.module.scss';
import classNames from 'classnames/bind';
import '@fortawesome/fontawesome-free/css/all.min.css';
import emptyCartImage from '../../img/empty-cart.webp';
import { showToast } from '../../components/Toast/index.js';
import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import { useNavigate } from 'react-router-dom';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

function Cart() {
    useHead('Giỏ hàng');
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [isApplying, setIsApplying] = useState(false);
    const navigate = useNavigate();

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

            if (response.data.success) {
                const formattedItems = response.data.cart.items.map(item => ({
                    id: item._id,
                    productId: item.product._id,
                    name: item.product.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.product.images && item.product.images.length > 0
                        ? item.product.images[0].url
                        : 'https://via.placeholder.com/150',
                    stock: item.product.stock
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
                title: "Cảnh báo",
                message: "Số lượng vượt quá tồn kho!",
                type: "warning",
                duration: 2000
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
                
        showToast({
            title: "Cập nhật",
            message: "Số lượng sản phẩm đã được cập nhật!",
            type: "info",
            duration: 2000
        });
                
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
            message: "Sản phẩm đã được xóa khỏi giỏ hàng!",
            type: "success",
            duration: 3000
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
            return appliedDiscount.value;
        } else {
            return 0;
        }
    };
    
    const calculateFinalTotal = () => {
        const subtotal = calculateTotal();
        const discount = calculateDiscount();
        return subtotal - discount;
    };

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) {
            showToast({
                title: "Lỗi",
                message: "Vui lòng nhập mã giảm giá",
                type: "error",
                duration: 2000
            });
            return;
        }
        
        setIsApplying(true);
        
        setTimeout(() => {
            const coupons = {
                'SALE10': { code: 'SALE10', name: 'Giảm 10%', type: 'percent', value: 10 },
                'SALE20': { code: 'SALE20', name: 'Giảm 20%', type: 'percent', value: 20 },
                'GIẢM50K': { code: 'GIẢM50K', name: 'Giảm 50.000đ', type: 'fixed', value: 50000 },
                'FREESHIP': { code: 'FREESHIP', name: 'Miễn phí vận chuyển', type: 'freeship', value: 0 }
            };
            
            const discount = coupons[couponCode.toUpperCase()];
            
            if (discount) {
                setAppliedDiscount(discount);
                showToast({
                    title: "Thành công",
                    message: `Đã áp dụng mã giảm giá ${discount.name}`,
                    type: "success",
                    duration: 3000
                });
            } else {
                setAppliedDiscount(null);
                showToast({
                    title: "Lỗi",
                    message: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
                    type: "error",
                    duration: 3000
                });
            }
            
            setIsApplying(false);
        }, 1000);
    };

    const handleRemoveCoupon = () => {
        setAppliedDiscount(null);
        setCouponCode('');
        showToast({
            title: "Đã xóa",
            message: "Đã xóa mã giảm giá",
            type: "info",
            duration: 2000
        });
    };

    function handleCheckout() {
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

    function renderEmptyCart() {
        return (
            <div className={cx('emptyCart')}>
                <div className={cx('row')}>
                    <div className={cx('col8')}>
                        <div className={cx('emptyCartContent')}>
                            <div className={cx('emptyCartIcon')}>
                                <img src={emptyCartImage} alt="Giỏ hàng trống" />
                            </div>
                            <h2>GIỎ HÀNG</h2>
                            <div className={cx('emptyCartText')}>
                                <p>Chúng tôi cam kết mang lại những giá trị cao nhất, chế độ bảo mật tốt nhất khi quý khách hàng tin dùng & mua sắm đồng hồ nam nữ chính hãng của thương hiệu <strong>Team2hand</strong></p>
                            </div>
                        </div>
                    </div>
                    <div className={cx('col4')}>
                        <div className={cx('cartSummaryEmpty')}>
                            <div className={cx('summaryItem')}>
                                <span>Tổng tiền</span>
                                <span>0 VND</span>
                            </div>
                            <div className={cx('summaryItem')}>
                                <span>Phụ thu</span>
                                <span>0 VND</span>
                            </div>
                            <div className={cx('summaryItem')}>
                                <span>Phí Vận Chuyển</span>
                                <span>0 VND</span>
                            </div>
                            <div className={cx('summaryItem', 'total')}>
                                <span>Thanh Toán</span>
                                <span>0 VND</span>
                            </div>
                            <button disabled className={cx('checkoutBtn')}>THANH TOÁN</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderCartItem(item) {
        return (
            <div key={item.id} className={cx('cartItem')}>
                <div className={cx('itemImage')}>
                    <img src={item.image} alt={item.name} />
                </div>
                <div className={cx('itemDetails')}>
                    <h3>{item.name}</h3>
                    <div className={cx('price')}>
                        {item.price.toLocaleString('vi-VN')} VND
                    </div>
                    <div className={cx('quantity')}>
                        <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                        >
                            -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                        >
                            +
                        </button>
                    </div>
                </div>
                <div className={cx('itemActions')}>
                    <button 
                        className={cx('removeBtn')}
                        onClick={() => handleRemoveItem(item.id)}
                    >
                        Xóa
                    </button>
                </div>
            </div>
        );
    }

    function renderCart() {
        return (
            <div className={cx('container')}>
                <div className={cx('row')}>
                    <div className={cx('col8')}>
                        <div className={cx('cartItems')}>
                            <h2>Giỏ hàng của bạn</h2>
                            <div className={cx('itemsList')}>
                                {cartItems.map(item => renderCartItem(item))}
                            </div>
                        </div>
                    </div>
                    <div className={cx('col4')}>
                        <div className={cx('discountSection')}>
                            <h3>Mã giảm giá</h3>
                            <div className={cx('couponForm')}>
                                <input 
                                    type="text" 
                                    placeholder="Nhập mã giảm giá" 
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    disabled={isApplying || appliedDiscount}
                                    className={cx('couponInput')}
                                />
                                {appliedDiscount ? (
                                    <button 
                                        className={cx('removeCouponBtn')} 
                                        onClick={handleRemoveCoupon}
                                        disabled={isApplying}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                ) : (
                                    <button 
                                        className={cx('applyCouponBtn')} 
                                        onClick={handleApplyCoupon}
                                        disabled={isApplying || !couponCode.trim()}
                                    >
                                        {isApplying ? 'Đang áp dụng...' : 'Áp dụng'}
                                    </button>
                                )}
                            </div>
                            
                            {appliedDiscount && (
                                <div className={cx('appliedCoupon')}>
                                    <div className={cx('couponBadge')}>
                                        <span className={cx('couponCode')}>{appliedDiscount.code}</span>
                                        <span className={cx('couponName')}>{appliedDiscount.name}</span>
                                    </div>
                                    <div className={cx('discountValue')}>
                                        {appliedDiscount.type === 'percent' 
                                            ? `- ${appliedDiscount.value}%` 
                                            : `- ${appliedDiscount.value.toLocaleString('vi-VN')} VND`}
                                    </div>
                                </div>
                            )}
                            
                            <div className={cx('suggestedCoupons')}>
                                <p>Mã giảm giá gợi ý:</p>
                                <div className={cx('couponList')}>
                                    <div className={cx('couponItem')} onClick={() => setCouponCode('SALE10')}>
                                        <span className={cx('couponTag')}>SALE10</span>
                                        <span className={cx('couponDesc')}>Giảm 10%</span>
                                    </div>
                                    <div className={cx('couponItem')} onClick={() => setCouponCode('GIẢM50K')}>
                                        <span className={cx('couponTag')}>GIẢM50K</span>
                                        <span className={cx('couponDesc')}>Giảm 50K</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className={cx('cartSummary')}>
                            <h3>Tổng đơn hàng</h3>
                            <div className={cx('summaryItem')}>
                                <span>Tạm tính:</span>
                                <span>{calculateTotal().toLocaleString('vi-VN')} VND</span>
                            </div>
                            {appliedDiscount && (
                                <div className={cx('summaryItem', 'discount')}>
                                    <span>Giảm giá:</span>
                                    <span>-{calculateDiscount().toLocaleString('vi-VN')} VND</span>
                                </div>
                            )}
                            <div className={cx('summaryItem')}>
                                <span>Phí vận chuyển:</span>
                                <span>Miễn phí</span>
                            </div>
                            <div className={cx('summaryItem', 'total')}>
                                <span>Tổng cộng:</span>
                                <span>{(appliedDiscount ? calculateFinalTotal() : calculateTotal()).toLocaleString('vi-VN')} VND</span>
                            </div>
                            <button 
                                className={cx('checkoutBtn')}
                                onClick={handleCheckout}
                            >
                                THANH TOÁN
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function renderLoginRequired() {
        return (
            <div className={cx('loginRequired')}>
                <div className={cx('loginMessage')}>
                    <h2>Vui lòng đăng nhập để xem giỏ hàng</h2>
                    <p>Bạn cần đăng nhập để xem và quản lý giỏ hàng của mình</p>
                    <button 
                        className={cx('loginBtn')}
                        onClick={() => navigate('/login')}
                    >
                        Đăng nhập
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className={cx('loading')}>Đang tải...</div>;
    }

    if (!isAuthenticated) {
        return renderLoginRequired();
    }

    return (
        <div className={cx('cartPage')}>
            {cartItems.length === 0 ? renderEmptyCart() : renderCart()}
        </div>
    );
}

export default Cart; 