import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as styles from './Checkout.module.scss';
import classNames from 'classnames/bind';
import { showToast } from '../../components/Toast/index.js';
import Breadcrumb from '../../components/Breadcrumb/index.js';
import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const Checkout = () => {
    useHead('Thanh toán | Team2hand');
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const [stockErrors, setStockErrors] = useState(null);
    const [copiedField, setCopiedField] = useState('');

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
                        title: 'Thông báo',
                        message: 'Vui lòng đăng nhập để tiếp tục thanh toán',
                        type: 'info',
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
                    if (!response.data.cart?.items || response.data.cart.items.length === 0) {
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
                        productId: item.product?._id,
                        name: item.product?.name || 'Sản phẩm',
                        price: item.price,
                        quantity: item.quantity,
                        image: item.product?.images && item.product.images.length > 0
                            ? item.product.images[0].url
                            : 'https://via.placeholder.com/150',
                    }));

                    setCartItems(formattedItems);
                    setCartTotal(response.data.cart.totalAmount || 0);

                    try {
                        const userResponse = await axios.get(`${API_URL}/auth/me`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (userResponse.data.success && userResponse.data.user) {
                            const user = userResponse.data.user;
                            setFormData(prev => ({
                                ...prev,
                                fullName: user.name || '',
                                phoneNo: user.phone || user.phoneNumber || ''
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

    const handlePaymentMethodSelect = (method) => {
        setFormData(prev => ({
            ...prev,
            paymentMethod: method
        }));
    };

    const handleCopyText = (text, fieldName) => {
        const onCopied = () => {
            setCopiedField(fieldName);
            showToast({
                title: "Đã sao chép",
                message: `Đã sao chép ${fieldName}`,
                type: "success",
                duration: 2000
            });
            setTimeout(() => setCopiedField(''), 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(onCopied)
                .catch(() => {
                    try {
                        const ta = document.createElement("textarea");
                        ta.value = text;
                        ta.style.position = "fixed";
                        ta.style.opacity = "0";
                        document.body.appendChild(ta);
                        ta.focus();
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        onCopied();
                    } catch (err) {
                        onCopied();
                    }
                });
        } else {
            onCopied();
        }
    };

    const shippingAmount = 0;
    const discountAmount = parseInt(localStorage.getItem('discountAmount')) || 0;
    const discountName = localStorage.getItem('discountName') || localStorage.getItem('discountCode') || 'MÃ GIẢM GIÁ';
    const totalAmount = Math.max(0, cartTotal - discountAmount + shippingAmount);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.fullName.trim() || !formData.address.trim() || !formData.city.trim() || !formData.phoneNo.trim()) {
            showToast({
                title: "Thông báo",
                message: "Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)",
                type: "warning",
                duration: 3000
            });
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');

            const orderData = {
                ...formData,
                discount: discountAmount,
                calculatedTotal: totalAmount
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
                    discount: discountAmount,
                    totalPrice: totalAmount
                };

                showToast({
                    title: "Thành công",
                    message: "Đơn hàng của bạn đã được tiếp nhận thành công!",
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
                showToast({
                    title: "Tồn kho không đủ",
                    message: "Một số sản phẩm không đủ số lượng để hoàn tất đơn hàng.",
                    type: "error",
                    duration: 5000
                });
                setStockErrors(insufficientItems);
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

    return (
        <div className={cx('checkoutPage')}>
            <div className={cx('container')}>
                {/* Editorial Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Giỏ hàng', to: '/cart' },
                        { label: 'Thanh toán' }
                    ]}
                />

                <div className={cx('pageHeader')}>
                    <h1 className={cx('pageTitle')}>THANH TOÁN ĐƠN HÀNG</h1>
                    <p className={cx('pageDesc')}>Vui lòng hoàn tất thông tin giao nhận và lựa chọn phương thức thanh toán.</p>
                </div>

                <form onSubmit={handleSubmit} className={cx('layoutGrid')}>
                    {/* Left Column: Architectural Form Panels */}
                    <div className={cx('billingColumn')}>
                        {/* Section 1: Shipping Details */}
                        <div className={cx('panelCard')}>
                            <div className={cx('panelHeader')}>
                                <span className={cx('sectionIndex')}>01</span>
                                <h2 className={cx('sectionHeading')}>ĐỊA CHỈ GIAO HÀNG</h2>
                            </div>

                            <div className={cx('formRow')}>
                                <div className={cx('formGroup')}>
                                    <label htmlFor="fullName">
                                        HỌ VÀ TÊN <span className={cx('required')}>*</span>
                                    </label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>

                                <div className={cx('formGroup')}>
                                    <label htmlFor="phoneNo">
                                        SỐ ĐIỆN THOẠI <span className={cx('required')}>*</span>
                                    </label>
                                    <input
                                        id="phoneNo"
                                        type="tel"
                                        name="phoneNo"
                                        value={formData.phoneNo}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="0912 345 678"
                                    />
                                </div>
                            </div>

                            <div className={cx('formGroup')}>
                                <label htmlFor="address">
                                    ĐỊA CHỈ CHI TIẾT <span className={cx('required')}>*</span>
                                </label>
                                <input
                                    id="address"
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Số nhà, tên đường, phường / xã"
                                />
                            </div>

                            <div className={cx('formRow')}>
                                <div className={cx('formGroup')}>
                                    <label htmlFor="city">
                                        TỈNH / THÀNH PHỐ <span className={cx('required')}>*</span>
                                    </label>
                                    <input
                                        id="city"
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="TP. Hồ Chí Minh"
                                    />
                                </div>

                                <div className={cx('formGroup')}>
                                    <label htmlFor="postalCode">
                                        MÃ BƯU CHÍNH (POSTAL CODE)
                                    </label>
                                    <input
                                        id="postalCode"
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        placeholder="700000"
                                    />
                                </div>
                            </div>

                            <div className={cx('formGroup')}>
                                <label htmlFor="note">
                                    GHI CHÚ ĐƠN HÀNG (TÙY CHỌN)
                                </label>
                                <textarea
                                    id="note"
                                    name="note"
                                    value={formData.note}
                                    onChange={handleInputChange}
                                    placeholder="Chỉ dẫn giao hàng hoặc yêu cầu đóng gói đặc biệt..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        {/* Section 2: Payment Method */}
                        <div className={cx('panelCard')}>
                            <div className={cx('panelHeader')}>
                                <span className={cx('sectionIndex')}>02</span>
                                <h2 className={cx('sectionHeading')}>PHƯƠNG THỨC THANH TOÁN</h2>
                            </div>

                            <div className={cx('paymentOptions')}>
                                {/* COD Option */}
                                <div
                                    className={cx('paymentCard', { active: formData.paymentMethod === 'COD' })}
                                    onClick={() => handlePaymentMethodSelect('COD')}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className={cx('customRadio', { checked: formData.paymentMethod === 'COD' })} />
                                    <div className={cx('paymentInfo')}>
                                        <span className={cx('paymentTitle')}>THANH TOÁN KHI NHẬN HÀNG (COD)</span>
                                        <span className={cx('paymentDesc')}>
                                            Kiểm tra sản phẩm và thanh toán tiền mặt trực tiếp cho nhân viên giao vận khi nhận kiện hàng.
                                        </span>
                                    </div>
                                </div>

                                {/* Banking Option */}
                                <div
                                    className={cx('paymentCard', { active: formData.paymentMethod === 'Banking' })}
                                    onClick={() => handlePaymentMethodSelect('Banking')}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className={cx('customRadio', { checked: formData.paymentMethod === 'Banking' })} />
                                    <div className={cx('paymentInfo')}>
                                        <span className={cx('paymentTitle')}>CHUYỂN KHOẢN NGÂN HÀNG (BANK TRANSFER)</span>
                                        <span className={cx('paymentDesc')}>
                                            Chuyển khoản trực tiếp qua ngân hàng trực tuyến 24/7 theo thông tin tài khoản thụ hưởng.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Minimalist Banking Details Manifest */}
                            {formData.paymentMethod === 'Banking' && (
                                <div className={cx('bankManifest')}>
                                    <div className={cx('bankManifestHeader')}>
                                        <span>THÔNG TIN TÀI KHOẢN THỤ HƯỞNG</span>
                                    </div>
                                    <div className={cx('bankRowsList')}>
                                        <div className={cx('bankRow')}>
                                            <span className={cx('bankLabel')}>NGÂN HÀNG</span>
                                            <span className={cx('bankValue')}>MB Bank (Ngân hàng Quân Đội)</span>
                                        </div>
                                        <div className={cx('bankRow')}>
                                            <span className={cx('bankLabel')}>SỐ TÀI KHOẢN</span>
                                            <div className={cx('bankValueGroup')}>
                                                <span className={cx('bankValue', 'mono')}>0987 654 321</span>
                                                <button
                                                    type="button"
                                                    className={cx('copyTextBtn')}
                                                    onClick={() => handleCopyText('0987 654 321', 'Số tài khoản')}
                                                >
                                                    {copiedField === 'Số tài khoản' ? 'Đã sao chép' : 'Sao chép'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className={cx('bankRow')}>
                                            <span className={cx('bankLabel')}>CHỦ TÀI KHOẢN</span>
                                            <span className={cx('bankValue')}>TEAM2HAND STORE</span>
                                        </div>
                                        <div className={cx('bankRow')}>
                                            <span className={cx('bankLabel')}>NỘI DUNG CHUYỂN KHOẢN</span>
                                            <div className={cx('bankValueGroup')}>
                                                <span className={cx('bankValue', 'mono')}>
                                                    {formData.phoneNo ? `${formData.phoneNo} THANHTOAN` : 'SĐT THANHTOAN'}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={cx('copyTextBtn')}
                                                    onClick={() => handleCopyText(
                                                        formData.phoneNo ? `${formData.phoneNo} THANHTOAN` : 'SĐT THANHTOAN',
                                                        'Nội dung'
                                                    )}
                                                >
                                                    {copiedField === 'Nội dung' ? 'Đã sao chép' : 'Sao chép'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cx('bankNote')}>
                                        * Đơn hàng sẽ được tiếp nhận và xử lý sau khi giao dịch chuyển khoản được hệ thống ghi nhận.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Manifest Summary */}
                    <div className={cx('summaryColumn')}>
                        <div className={cx('summaryCard')}>
                            <div className={cx('summaryHeader')}>
                                <span>ĐƠN HÀNG</span>
                                <span className={cx('monoCount')}>
                                    {cartItems.length.toString().padStart(2, '0')} sản phẩm
                                </span>
                            </div>

                            {/* Order Items List */}
                            <div className={cx('orderItemsList')}>
                                {cartItems.map(item => (
                                    <div key={item.id} className={cx('orderItemRow')}>
                                        <div className={cx('productImageFrame')}>
                                            <img src={item.image} alt={item.name} />
                                        </div>
                                        <div className={cx('productInfo')}>
                                            <div className={cx('productName')}>{item.name}</div>
                                            <div className={cx('productSub')}>
                                                <span>SL: {item.quantity}</span>
                                                <span className={cx('sep')}>×</span>
                                                <span>{Number(item.price).toLocaleString('vi-VN')} ₫</span>
                                            </div>
                                        </div>
                                        <div className={cx('productLineTotal')}>
                                            {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Financial Summary */}
                            <div className={cx('summaryTotals')}>
                                <div className={cx('summaryRow')}>
                                    <span className={cx('sumLabel')}>TẠM TÍNH</span>
                                    <span className={cx('sumValue')}>
                                        {cartTotal.toLocaleString('vi-VN')} ₫
                                    </span>
                                </div>

                                {discountAmount > 0 && (
                                    <div className={cx('summaryRow', 'discountRow')}>
                                        <span className={cx('sumLabel')}>CHIẾT KHẤU ({discountName})</span>
                                        <span className={cx('sumValue')}>
                                            -{discountAmount.toLocaleString('vi-VN')} ₫
                                        </span>
                                    </div>
                                )}

                                <div className={cx('summaryRow')}>
                                    <span className={cx('sumLabel')}>VẬN CHUYỂN</span>
                                    <span className={cx('sumValue')}>MIỄN PHÍ</span>
                                </div>

                                <div className={cx('summaryRow', 'grandTotalRow')}>
                                    <span className={cx('totalLabel')}>TỔNG THANH TOÁN</span>
                                    <span className={cx('totalValue')}>
                                        {totalAmount.toLocaleString('vi-VN')} ₫
                                    </span>
                                </div>
                            </div>

                            {/* Primary Action Button */}
                            <button
                                type="submit"
                                className={cx('submitBtn')}
                                disabled={isLoading || cartItems.length === 0}
                            >
                                {isLoading ? 'ĐANG XỬ LÝ ĐƠN HÀNG...' : 'HOÀN TẤT ĐẶT HÀNG'}
                            </button>

                            {/* Back to Cart Link */}
                            <div className={cx('backToCart')}>
                                <button
                                    type="button"
                                    className={cx('backLink')}
                                    onClick={() => navigate('/cart')}
                                >
                                    ← QUAY LẠI GIỎ HÀNG
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Stock Error Modal */}
            {stockErrors && stockErrors.length > 0 && (
                <div className={cx('modalOverlay')} onClick={() => setStockErrors(null)}>
                    <div className={cx('modalContent')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modalHeader')}>
                            <span className={cx('modalHeaderTitle')}>TỒN KHO KHÔNG ĐỦ</span>
                            <button
                                type="button"
                                className={cx('modalCloseBtn')}
                                onClick={() => setStockErrors(null)}
                                aria-label="Đóng"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className={cx('modalBody')}>
                            <p>Rất tiếc, các sản phẩm sau hiện không còn đủ số lượng tồn kho:</p>
                            <ul className={cx('insufficientList')}>
                                {stockErrors.map((item, idx) => (
                                    <li key={idx}>
                                        <span className={cx('stockProdName')}>{item.product}</span>
                                        <span className={cx('stockInfo')}>
                                            Hiện có: {item.currentStock} | Bạn đặt: {item.requestedQuantity}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p>Vui lòng quay lại giỏ hàng để điều chỉnh số lượng.</p>
                        </div>
                        <div className={cx('modalFooter')}>
                            <button
                                type="button"
                                className={cx('cancelModalBtn')}
                                onClick={() => setStockErrors(null)}
                            >
                                ĐÓNG
                            </button>
                            <button
                                type="button"
                                className={cx('returnCartBtn')}
                                onClick={() => {
                                    setStockErrors(null);
                                    navigate('/cart');
                                }}
                            >
                                QUAY LẠI GIỎ HÀNG
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
