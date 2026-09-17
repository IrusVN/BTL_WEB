import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import * as styles from './OrderConfirmation.module.scss';
import classNames from 'classnames/bind';
import { resendOrderConfirmationEmail } from '../../services/orderService.js';
import { showToast } from '../../components/Toast/index.js';
import Breadcrumb from '../../components/Breadcrumb/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const OrderConfirmation = () => {
    useHead('Biên lai Đơn hàng | Team2hand');
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);

    const { orderDetails, success } = location.state || {};

    useEffect(() => {
        if (!success || !orderDetails) {
            navigate('/');
        }
    }, [success, orderDetails, navigate]);

    if (!success || !orderDetails) {
        return null;
    }

    const subtotal = orderDetails.itemsPrice || 0;
    const shippingPrice = orderDetails.shippingPrice || 0;
    const discount = orderDetails.discount || 0;
    const totalPrice = orderDetails.totalPrice || (subtotal - discount + shippingPrice);

    const handleCopyOrderId = () => {
        if (orderDetails?._id) {
            const onCopied = () => {
                setCopied(true);
                showToast({
                    title: "Đã sao chép",
                    message: "Mã đơn hàng đã được sao chép",
                    type: "success",
                    duration: 2000
                });
                setTimeout(() => setCopied(false), 2500);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(orderDetails._id)
                    .then(onCopied)
                    .catch(() => {
                        try {
                            const ta = document.createElement("textarea");
                            ta.value = orderDetails._id;
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
        }
    };

    const handleSendEmailConfirmation = async () => {
        try {
            setIsLoading(true);
            setErrorMessage('');

            await resendOrderConfirmationEmail(orderDetails._id);

            showToast({
                title: "Thành công",
                message: "Email biên lai xác nhận đã được gửi đến hòm thư của bạn.",
                type: "success",
                duration: 3500
            });
        } catch (error) {
            let errorMsg = "Không thể gửi email xác nhận.";

            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.request) {
                errorMsg = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
            } else if (error.message) {
                errorMsg = error.message;
            }

            setErrorMessage(errorMsg);

            showToast({
                title: "Thông báo",
                message: errorMsg,
                type: "error",
                duration: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formattedDate = orderDetails.createdAt
        ? new Date(orderDetails.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
          })
        : new Date().toLocaleDateString('vi-VN');

    return (
        <div className={cx('orderConfirmationPage')}>
            <div className={cx('container')}>
                {/* Editorial Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Giỏ hàng', to: '/cart' },
                        { label: 'Xác nhận đơn hàng' }
                    ]}
                />

                {/* Digital Editorial Receipt Card */}
                <div className={cx('receiptCard')}>
                    {/* Top Metadata Header */}
                    <div className={cx('receiptHeader')}>
                        <div className={cx('metaTrack')}>
                            <span className={cx('metaType')}>DIGITAL RECEIPT & INVOICE</span>
                            <span className={cx('metaDate')}>{formattedDate}</span>
                        </div>
                        <h1 className={cx('receiptTitle')}>ĐƠN HÀNG ĐÃ ĐƯỢC XÁC NHẬN</h1>
                        <p className={cx('receiptDesc')}>
                            Cảm ơn quý khách đã tin tưởng và đồng hành cùng <strong>TEAM2HAND</strong>. Đơn hàng của bạn đã được tiếp nhận thành công và chuyển sang bộ phận điều phối.
                        </p>

                        <div className={cx('orderRefContainer')}>
                            <div className={cx('orderRefLabel')}>MÃ ĐƠN HÀNG</div>
                            <div className={cx('orderRefValue')}>#{orderDetails._id}</div>
                            <button
                                type="button"
                                className={cx('copyBtn')}
                                onClick={handleCopyOrderId}
                                title="Sao chép mã đơn hàng"
                                aria-label="Sao chép mã đơn hàng"
                            >
                                {copied ? "Đã sao chép" : "Sao chép"}
                            </button>
                        </div>
                    </div>

                    {/* 4-Column Architectural Manifest Grid */}
                    <div className={cx('manifestGrid')}>
                        <div className={cx('manifestCol')}>
                            <span className={cx('manifestColLabel')}>01 / THỜI GIAN ĐẶT</span>
                            <span className={cx('manifestColValue', 'mono')}>{formattedDate}</span>
                        </div>
                        <div className={cx('manifestCol')}>
                            <span className={cx('manifestColLabel')}>02 / PHƯƠNG THỨC</span>
                            <span className={cx('manifestColValue')}>
                                {orderDetails.paymentInfo?.method === 'Banking'
                                    ? 'Chuyển khoản ngân hàng'
                                    : 'Thanh toán khi nhận hàng (COD)'}
                            </span>
                        </div>
                        <div className={cx('manifestCol')}>
                            <span className={cx('manifestColLabel')}>03 / TRẠNG THÁI</span>
                            <span className={cx('statusTag', { isPaid: orderDetails.paymentInfo?.status === 'Đã thanh toán' })}>
                                {orderDetails.paymentInfo?.status === 'Đã thanh toán' ? 'ĐÃ THANH TOÁN' : 'ĐÃ GHI NHẬN'}
                            </span>
                        </div>
                        <div className={cx('manifestCol')}>
                            <span className={cx('manifestColLabel')}>04 / ĐỊA CHỈ GIAO HÀNG</span>
                            <span className={cx('manifestColValue', 'address')}>
                                <strong>{orderDetails.shippingInfo?.fullName}</strong> — {orderDetails.shippingInfo?.phoneNo}
                                <br />
                                {orderDetails.shippingInfo?.address}, {orderDetails.shippingInfo?.city}
                            </span>
                        </div>
                    </div>

                    {/* Itemized Manifest Table */}
                    <div className={cx('itemsSection')}>
                        <div className={cx('sectionBar')}>
                            <span>CHI TIẾT SẢN PHẨM ({orderDetails.orderItems?.length || 0})</span>
                            <span className={cx('currencyNote')}>ĐƠN VỊ: VND (₫)</span>
                        </div>

                        <div className={cx('productsTable')}>
                            {orderDetails.orderItems?.map((item, index) => (
                                <div key={index} className={cx('productRow')}>
                                    <div className={cx('productImageFrame')}>
                                        <img src={item.image} alt={item.name} />
                                    </div>
                                    <div className={cx('productMain')}>
                                        <h4 className={cx('productTitle')}>{item.name}</h4>
                                        <div className={cx('productSub')}>
                                            <span className={cx('unitPrice')}>{Number(item.price).toLocaleString('vi-VN')} ₫</span>
                                            <span className={cx('qtyDivider')}>×</span>
                                            <span className={cx('qtyText')}>SL: {item.quantity}</span>
                                        </div>
                                    </div>
                                    <div className={cx('productLineTotal')}>
                                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className={cx('financialSection')}>
                        <div className={cx('financialRow')}>
                            <span className={cx('finLabel')}>TẠM TÍNH</span>
                            <span className={cx('finValue')}>{subtotal.toLocaleString('vi-VN')} ₫</span>
                        </div>

                        {discount > 0 && (
                            <div className={cx('financialRow', 'discountRow')}>
                                <span className={cx('finLabel')}>CHIẾT KHẤU / VOUCHER</span>
                                <span className={cx('finValue')}>-{discount.toLocaleString('vi-VN')} ₫</span>
                            </div>
                        )}

                        <div className={cx('financialRow')}>
                            <span className={cx('finLabel')}>PHÍ VẬN CHUYỂN TOÀN QUỐC</span>
                            <span className={cx('finValue')}>
                                {shippingPrice === 0 ? 'MIỄN PHÍ' : `${shippingPrice.toLocaleString('vi-VN')} ₫`}
                            </span>
                        </div>

                        <div className={cx('financialRow', 'grandTotalRow')}>
                            <span className={cx('totalLabel')}>TỔNG THANH TOÁN</span>
                            <span className={cx('totalValue')}>{totalPrice.toLocaleString('vi-VN')} ₫</span>
                        </div>
                    </div>

                    {/* Architectural Action Buttons */}
                    <div className={cx('actionsBar')}>
                        <button
                            type="button"
                            className={cx('primaryBtn')}
                            onClick={() => navigate('/my-orders')}
                        >
                            <span>XEM ĐƠN HÀNG CỦA TÔI</span>
                        </button>

                        <button
                            type="button"
                            className={cx('secondaryBtn')}
                            onClick={handleSendEmailConfirmation}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span>ĐANG GỬI BIÊN LAI...</span>
                            ) : (
                                <span>GỬI LẠI BIÊN LAI QUA EMAIL</span>
                            )}
                        </button>
                    </div>

                    <div className={cx('backLinkWrapper')}>
                        <button
                            type="button"
                            className={cx('backHomeLink')}
                            onClick={() => navigate('/')}
                        >
                            ← TIẾP TỤC KHÁM PHÁ BỘ SƯU TẬP
                        </button>
                    </div>

                    {/* Error message banner if email sending failed */}
                    {errorMessage && (
                        <div className={cx('errorNotice')} role="alert">
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
