import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as styles from './Checkout.module.scss';
import classNames from 'classnames/bind';
import { showToast } from '../../components/Toast/index.js';
import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const Checkout = () => {
    useHead('Thanh toán');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    
    const [formData, setFormData] = useState({
        fullName: '',
        address: '',
        city: '',
        phoneNo: '',
        postalCode: '',
        country: 'Việt Nam',
        paymentMethod: 'COD',
        note: ''
    });
    
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    showToast({
                        title: 'Lỗi',
                        message: 'Vui lòng đăng nhập để tiếp tục',
                        type: 'error',
                        duration: 3000
                    });
                    navigate('/login');
                    return;
                }
                
                const response = await axios.get(`${API_URL}/cart`, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                });
                
                if (response.data.success) {
                    if (response.data.cart.items.length === 0) {
                        showToast({
                            title: 'Thông báo',
                            message: 'Giỏ hàng trống, không thể thanh toán',
                            type: 'warning',
                            duration: 3000
                        });
                        navigate('/cart');
                        return;
                    }
                    
                    const formattedItems = response.data.cart.items.map(item => ({
                        id: item._id,
                        productId: item.product._id,
                        name: item.product.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.product.images && item.product.images.length > 0
                            ? item.product.images[0].url
                            : 'https://via.placeholder.com/150',
                    }));
                    
                    setCartItems(formattedItems);
                    setCartTotal(response.data.cart.totalAmount);
                    
                    try {
                        const userResponse = await axios.get(`${API_URL}/auth/me`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        if (userResponse.data.success && userResponse.data.user) {
                            const user = userResponse.data.user;
                            setFormData(prev => ({
                                ...prev,
                                fullName: user.name || '',
                                phoneNo: user.phone || ''
                            }));
                        }
                    } catch (error) {
                        console.error('Lỗi khi lấy thông tin người dùng:', error);
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy giỏ hàng:', error);
                showToast({
                    title: 'Lỗi',
                    message: 'Không thể lấy thông tin giỏ hàng',
                    type: 'error',
                    duration: 3000
                });
                navigate('/cart');
            }
        };
        
        fetchCart();
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.fullName || !formData.address || !formData.city || !formData.phoneNo) {
            showToast({
                title: "Lỗi",
                message: "Vui lòng điền đầy đủ thông tin giao hàng!",
                type: "error",
                duration: 3000
            });
            return;
        }
        
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            const discount = parseInt(localStorage.getItem('discountAmount')) || 0;
            const orderData = {
                ...formData,
                discount: discount,
                calculatedTotal: cartTotal - discount + shippingAmount
            };
            
            const response = await axios.post(
                `${API_URL}/cart/checkout`,
                orderData,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            
            if (response.data.success) {
                const orderWithDiscount = {
                    ...response.data.order,
                    discount: discount,
                    totalPrice: cartTotal - discount + shippingAmount
                };
                
                showToast({
                    title: "Thành công",
                    message: "Đơn hàng của bạn đã được đặt thành công!",
                    type: "success",
                    duration: 3000
                });
                
                window.dispatchEvent(new Event('cart-updated'));
                
                localStorage.removeItem('discount');
                localStorage.removeItem('discountAmount');
                localStorage.removeItem('discountType');
                localStorage.removeItem('discountValue');
                localStorage.removeItem('discountName');
                localStorage.removeItem('discountCode');
                
                navigate('/order-confirmation', { 
                    state: { 
                        orderDetails: orderWithDiscount,
                        success: true 
                    } 
                });
            } else {
                showToast({
                    title: "Lỗi",
                    message: response.data.message || "Không thể tạo đơn hàng",
                    type: "error",
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi tạo đơn hàng:', error);
            
            if (error.response?.data?.stockCheckResults) {
                const insufficientItems = error.response.data.stockCheckResults.filter(item => item.status === 'error');
                
                const errorMessages = insufficientItems.map(item => 
                    `${item.product}: ${item.message}`
                );
                
                showToast({
                    title: "Số lượng tồn kho không đủ",
                    message: "Vui lòng quay lại giỏ hàng để điều chỉnh số lượng sản phẩm.",
                    type: "error",
                    duration: 5000
                });
                
                showStockErrorModal(insufficientItems);
            } else {
                showToast({
                    title: "Lỗi",
                    message: error.response?.data?.message || "Đã xảy ra lỗi khi tạo đơn hàng",
                    type: "error",
                    duration: 3000
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const showStockErrorModal = (insufficientItems) => {
        const modalContainer = document.createElement('div');
        modalContainer.className = cx('stockErrorModal');
        
        modalContainer.innerHTML = `
            <div class="${cx('modalContent')}">
                <div class="${cx('modalHeader')}">
                    <h3>Số lượng tồn kho không đủ</h3>
                    <button class="${cx('closeBtn')}">×</button>
                </div>
                <div class="${cx('modalBody')}">
                    <p>Các sản phẩm sau đây không còn đủ số lượng trong kho:</p>
                    <ul class="${cx('insufficientList')}">
                        ${insufficientItems.map(item => `
                            <li>
                                <span class="${cx('productName')}">${item.product}</span>
                                <span class="${cx('stockInfo')}">Tồn kho: ${item.currentStock} | Bạn đặt: ${item.requestedQuantity}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <p>Vui lòng quay lại giỏ hàng để điều chỉnh số lượng sản phẩm.</p>
                </div>
                <div class="${cx('modalFooter')}">
                    <button class="${cx('returnCartBtn')}">Quay lại giỏ hàng</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalContainer);
        
        const closeBtn = modalContainer.querySelector(`.${cx('closeBtn')}`);
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        const returnCartBtn = modalContainer.querySelector(`.${cx('returnCartBtn')}`);
        returnCartBtn.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
            navigate('/cart');
        });
    };

    const taxAmount = 0;
    const shippingAmount = 0;
    const discountAmount = parseInt(localStorage.getItem('discountAmount')) || 0;
    const totalAmount = cartTotal - discountAmount + shippingAmount;

    return (
        <div className={cx('checkoutPage')}>
            <div className={cx('container')}>
                <div className={cx('pageTitle')}>
                    <h1>Thanh toán</h1>
                </div>
                
                <div className={cx('row')}>
                    <div className={cx('col8')}>
                        <div className={cx('checkoutBilling')}>
                            <h2>Thông tin giao hàng</h2>
                            <form onSubmit={handleSubmit}>
                                <div className={cx('formGroup')}>
                                    <label>Họ tên người nhận <span className={cx('required')}>*</span></label>
                                    <input 
                                        type="text" 
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Nhập họ và tên người nhận hàng"
                                    />
                                </div>
                                
                                <div className={cx('formGroup')}>
                                    <label>Địa chỉ <span className={cx('required')}>*</span></label>
                                    <input 
                                        type="text" 
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Số nhà, đường, phường/xã"
                                    />
                                </div>
                                
                                <div className={cx('row')}>
                                    <div className={cx('col6')}>
                                        <div className={cx('formGroup')}>
                                            <label>Thành phố/Tỉnh <span className={cx('required')}>*</span></label>
                                            <input 
                                                type="text" 
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Nhập thành phố/tỉnh"
                                            />
                                        </div>
                                    </div>
                                    <div className={cx('col6')}>
                                        <div className={cx('formGroup')}>
                                            <label>Mã bưu điện</label>
                                            <input 
                                                type="text" 
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleInputChange}
                                                placeholder="Nhập mã bưu điện (nếu có)"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={cx('formGroup')}>
                                    <label>Số điện thoại <span className={cx('required')}>*</span></label>
                                    <input 
                                        type="tel" 
                                        name="phoneNo"
                                        value={formData.phoneNo}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Nhập số điện thoại liên hệ"
                                    />
                                </div>
                                
                                <div className={cx('formGroup')}>
                                    <label>Phương thức thanh toán</label>
                                    <div className={cx('paymentOptions')}>
                                        <div className={cx('paymentOption')}>
                                            <input 
                                                type="radio" 
                                                id="cod" 
                                                name="paymentMethod" 
                                                value="COD"
                                                checked={formData.paymentMethod === "COD"}
                                                onChange={handleInputChange}
                                            />
                                            <label htmlFor="cod">Thanh toán khi nhận hàng (COD)</label>
                                        </div>
                                        <div className={cx('paymentOption')}>
                                            <input 
                                                type="radio" 
                                                id="banking" 
                                                name="paymentMethod" 
                                                value="Banking"
                                                checked={formData.paymentMethod === "Banking"}
                                                onChange={handleInputChange}
                                            />
                                            <label htmlFor="banking">Chuyển khoản ngân hàng</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={cx('formGroup')}>
                                    <label>Ghi chú đơn hàng</label>
                                    <textarea 
                                        name="note"
                                        value={formData.note}
                                        onChange={handleInputChange}
                                        placeholder="Ghi chú về đơn hàng, ví dụ: thời gian giao hàng hoặc địa điểm giao hàng chi tiết hơn."
                                        rows="4"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className={cx('col4')}>
                        <div className={cx('checkoutOrder')}>
                            <h4>Đơn hàng của bạn</h4>
                            
                            <div className={cx('orderSummary')}>
                                <div className={cx('cartItems')}>
                                    {cartItems.map(item => (
                                        <div key={item.id} className={cx('orderItem')}>
                                            <div className={cx('productInfo')}>
                                                <div className={cx('productThumb')}>
                                                    <img src={item.image} alt={item.name} />
                                                    <span className={cx('quantity')}>{item.quantity}</span>
                                                </div>
                                                <div className={cx('productName')}>
                                                    {item.name}
                                                </div>
                                            </div>
                                            <div className={cx('productPrice')}>
                                                {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className={cx('orderTotal')}>
                                    <ul>
                                        <li>Tạm tính <span>{cartTotal.toLocaleString('vi-VN')} VND</span></li>
                                        {parseInt(localStorage.getItem('discountAmount')) > 0 && (
                                            <li className={cx('discount')}>
                                                Giảm giá ({localStorage.getItem('discountName') || 'Mã giảm giá'}) 
                                                <span>-{parseInt(localStorage.getItem('discountAmount')).toLocaleString('vi-VN')} VND</span>
                                            </li>
                                        )}
                                        <li>Phí vận chuyển <span>Miễn phí</span></li>
                                        <li className={cx('totalAmount')}>Tổng cộng <span>{(parseInt(localStorage.getItem('discountAmount')) > 0 ? cartTotal - parseInt(localStorage.getItem('discountAmount')) : cartTotal).toLocaleString('vi-VN')} VND</span></li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className={cx('orderBtn')}>
                                <button 
                                    type="submit" 
                                    className={cx('siteBtn')}
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Đang xử lý...' : 'Đặt hàng'}
                                </button>
                            </div>
                            
                            <div className={cx('backToCart')}>
                                <button 
                                    type="button" 
                                    className={cx('backBtn')}
                                    onClick={() => navigate('/cart')}
                                >
                                    Quay lại giỏ hàng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout; 