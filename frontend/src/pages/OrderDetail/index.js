import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as styles from './OrderDetail.module.scss';
import classNames from 'classnames/bind';
import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import { useAuth } from '../../context/AuthContext.js';
import Breadcrumb from '../../components/Breadcrumb/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const OrderStatusBadge = ({ status }) => {
    let statusClass = 'statusDefault';
    let statusLabel = status;

    switch (status) {
        case 'Processing':
            statusClass = 'statusProcessing';
            statusLabel = 'Đang xử lý';
            break;
        case 'Confirmed':
            statusClass = 'statusConfirmed';
            statusLabel = 'Đã xác nhận';
            break;
        case 'Shipping':
        case 'Shipped':
            statusClass = 'statusShipping';
            statusLabel = 'Đang giao hàng';
            break;
        case 'Delivered':
            statusClass = 'statusDelivered';
            statusLabel = 'Đã giao hàng';
            break;
        case 'Cancelled':
            statusClass = 'statusCancelled';
            statusLabel = 'Đã hủy';
            break;
        default:
            statusClass = 'statusDefault';
            statusLabel = status || 'Không xác định';
    }

    return (
        <span className={cx('statusBadge', statusClass)}>
            <span className={cx('statusDot')}></span>
            {statusLabel}
        </span>
    );
};

const OrderDetail = () => {
    useHead('Chi tiết đơn hàng | Team2hand');
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);
    const [copied, setCopied] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        fetchOrderDetails();
    }, [id, navigate, user]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${API_URL}/orders/order/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });

            if (response.data.success) {
                setOrder(response.data.order);
            } else {
                showToast({
                    title: 'Lỗi',
                    message: 'Không thể tải thông tin đơn hàng',
                    type: 'error',
                    duration: 3000
                });
                navigate('/my-orders');
            }
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            showToast({
                title: 'Lỗi',
                message: error.response?.data?.message || 'Không thể tải thông tin đơn hàng',
                type: 'error',
                duration: 3000
            });
            navigate('/my-orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyOrderId = () => {
        if (!order?._id) return;
        const onCopied = () => {
            setCopied(true);
            showToast({
                title: 'Đã sao chép',
                message: 'Mã đơn hàng đã được sao chép',
                type: 'success',
                duration: 2000
            });
            setTimeout(() => setCopied(false), 2500);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(order._id).then(onCopied).catch(onCopied);
        } else {
            onCopied();
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;

        try {
            setCancelling(true);
            const token = localStorage.getItem('token');

            const response = await axios.put(
                `${API_URL}/orders/order/${id}/cancel`,
                { status: 'Cancelled' },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                setOrder((prev) => ({ ...prev, orderStatus: 'Cancelled' }));
                setShowConfirmCancel(false);

                showToast({
                    title: 'Thành công',
                    message: 'Đơn hàng đã được hủy thành công',
                    type: 'success',
                    duration: 3000
                });
            } else {
                showToast({
                    title: 'Lỗi',
                    message: response.data.message || 'Không thể hủy đơn hàng',
                    type: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi hủy đơn hàng:', error);
            showToast({
                title: 'Lỗi',
                message: error.response?.data?.message || 'Không thể hủy đơn hàng',
                type: 'error',
                duration: 3000
            });
        } finally {
            setCancelling(false);
        }
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={cx('orderDetailPage')}>
                <div className={cx('container')}>
                    <div className={cx('loadingSection')}>
                        <div className={cx('spinner')}></div>
                        <p>Đang đồng bộ thông tin đơn hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={cx('orderDetailPage')}>
                <div className={cx('container')}>
                    <div className={cx('errorCard')}>
                        <div className={cx('errorIcon')}>
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                        <h2>KHÔNG TÌM THẤY ĐƠN HÀNG</h2>
                        <p>Đơn hàng này không tồn tại hoặc bạn không có quyền truy cập thông tin.</p>
                        <Link to="/my-orders" className={cx('backHomeBtn')}>
                            <span>QUAY LẠI DANH SÁCH ĐƠN HÀNG</span>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isCancelled = order.orderStatus === 'Cancelled';
    const activeSteps = ['Processing', 'Confirmed', 'Shipping', 'Delivered'];
    const currentStepIndex = isCancelled
        ? -1
        : activeSteps.indexOf(order.orderStatus === 'Shipped' ? 'Shipping' : order.orderStatus);

    return (
        <div className={cx('orderDetailPage')}>
            <div className={cx('container')}>
                {/* Breadcrumb Navigation */}
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Đơn hàng của tôi', to: '/my-orders' },
                        { label: `Đơn hàng #${order._id}` }
                    ]}
                />

                {/* Digital Order Manifest Card */}
                <div className={cx('manifestCard')}>
                    {/* Header: Digital Receipt & Invoice Banner */}
                    <div className={cx('manifestHeader')}>
                        <div className={cx('headerTopMeta')}>
                            <span className={cx('metaBadge')}>OFFICIAL DIGITAL MANIFEST</span>
                            <span className={cx('metaDate')}>{formatDate(order.createdAt)}</span>
                        </div>

                        <div className={cx('headerMainBar')}>
                            <div className={cx('orderIdentity')}>
                                <h1 className={cx('orderTitle')}>CHI TIẾT ĐƠN HÀNG</h1>
                                <div className={cx('orderRefWrap')}>
                                    <span className={cx('refLabel')}>MÃ ĐƠN HÀNG:</span>
                                    <span className={cx('refValue')}>#{order._id}</span>
                                    <button
                                        type="button"
                                        className={cx('copyBtn')}
                                        onClick={handleCopyOrderId}
                                        title="Sao chép mã đơn hàng"
                                    >
                                        {copied ? 'Đã sao chép' : 'Sao chép'}
                                    </button>
                                </div>
                            </div>
                            <div className={cx('headerStatus')}>
                                <OrderStatusBadge status={order.orderStatus} />
                            </div>
                        </div>
                    </div>

                    {/* Stepper or Cancelled Alert Banner */}
                    {isCancelled ? (
                        <div className={cx('cancelledBanner')}>
                            <div className={cx('cancelledIcon')}>
                                <i className="fas fa-ban"></i>
                            </div>
                            <div className={cx('cancelledContent')}>
                                <h4>ĐƠN HÀNG ĐÃ BỊ HỦY</h4>
                                <p>
                                    Đơn hàng này đã kết thúc xử lý. Toàn bộ sản phẩm trong đơn đã được tự động hoàn lại vào kho. Nếu bạn cần hỗ trợ, xin vui lòng liên hệ bộ phận chăm sóc khách hàng.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className={cx('stepperSection')}>
                            <div className={cx('stepperHeader')}>
                                <span className={cx('stepperTitle')}>TIẾN TRÌNH XỬ LÝ ĐƠN HÀNG</span>
                                <span className={cx('stepperSub')}>CẬP NHẬT THEO THỜI GIAN THỰC</span>
                            </div>
                            <div className={cx('stepperBar')}>
                                {[
                                    { step: 1, key: 'Processing', label: 'Đang xử lý', icon: 'fas fa-receipt' },
                                    { step: 2, key: 'Confirmed', label: 'Đã xác nhận', icon: 'fas fa-check-circle' },
                                    { step: 3, key: 'Shipping', label: 'Đang giao hàng', icon: 'fas fa-shipping-fast' },
                                    { step: 4, key: 'Delivered', label: 'Đã giao hàng', icon: 'fas fa-box' }
                                ].map((s, index) => {
                                    const isComplete = currentStepIndex >= index;
                                    const isCurrent = currentStepIndex === index;
                                    return (
                                        <div
                                            key={s.key}
                                            className={cx('stepNode', {
                                                complete: isComplete,
                                                current: isCurrent
                                            })}
                                        >
                                            <div className={cx('nodeIconWrap')}>
                                                <i className={s.icon}></i>
                                            </div>
                                            <div className={cx('nodeLabel')}>{s.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3-Column Info Manifest Grid */}
                    <div className={cx('infoGrid')}>
                        <div className={cx('infoCol')}>
                            <div className={cx('colHeader')}>
                                <i className="fas fa-map-marker-alt"></i>
                                <span>THÔNG TIN GIAO HÀNG</span>
                            </div>
                            <div className={cx('colBody')}>
                                <p className={cx('recipientName')}>
                                    <strong>{order.shippingInfo?.fullName}</strong>
                                </p>
                                <p className={cx('recipientPhone')}>
                                    SĐT: <span>{order.shippingInfo?.phoneNo}</span>
                                </p>
                                <p className={cx('recipientAddress')}>
                                    {order.shippingInfo?.address}, {order.shippingInfo?.city}
                                </p>
                                {order.shippingInfo?.postalCode && (
                                    <p className={cx('recipientPostal')}>
                                        Mã bưu điện: {order.shippingInfo.postalCode}
                                    </p>
                                )}
                                <p className={cx('recipientCountry')}>
                                    Quốc gia: {order.shippingInfo?.country || 'Việt Nam'}
                                </p>
                            </div>
                        </div>

                        <div className={cx('infoCol')}>
                            <div className={cx('colHeader')}>
                                <i className="fas fa-credit-card"></i>
                                <span>THÔNG TIN THANH TOÁN</span>
                            </div>
                            <div className={cx('colBody')}>
                                <div className={cx('infoRow')}>
                                    <span className={cx('infoLabel')}>Phương thức:</span>
                                    <span className={cx('infoVal')}>
                                        {order.paymentInfo?.method === 'Banking'
                                            ? 'Chuyển khoản ngân hàng'
                                            : 'Thanh toán khi nhận hàng (COD)'}
                                    </span>
                                </div>
                                <div className={cx('infoRow')}>
                                    <span className={cx('infoLabel')}>Trạng thái:</span>
                                    <span
                                        className={cx('statusInlineTag', {
                                            isPaid: order.paymentInfo?.status === 'Đã thanh toán'
                                        })}
                                    >
                                        {order.paymentInfo?.status === 'Đã thanh toán'
                                            ? 'Đã thanh toán'
                                            : 'Chờ thanh toán'}
                                    </span>
                                </div>
                                {order.paidAt && (
                                    <div className={cx('infoRow')}>
                                        <span className={cx('infoLabel')}>Thời gian TT:</span>
                                        <span className={cx('infoVal')}>{formatDate(order.paidAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={cx('infoCol')}>
                            <div className={cx('colHeader')}>
                                <i className="fas fa-clipboard-list"></i>
                                <span>CHI TIẾT VẬN HÀNH</span>
                            </div>
                            <div className={cx('colBody')}>
                                <div className={cx('infoRow')}>
                                    <span className={cx('infoLabel')}>Thời gian đặt:</span>
                                    <span className={cx('infoVal')}>{formatDate(order.createdAt)}</span>
                                </div>
                                {order.deliveredAt && (
                                    <div className={cx('infoRow')}>
                                        <span className={cx('infoLabel')}>Giao hàng lúc:</span>
                                        <span className={cx('infoVal')}>{formatDate(order.deliveredAt)}</span>
                                    </div>
                                )}
                                {order.note && (
                                    <div className={cx('infoRow')}>
                                        <span className={cx('infoLabel')}>Ghi chú:</span>
                                        <span className={cx('infoVal', 'note')}>{order.note}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Itemized Order Products Section */}
                    <div className={cx('itemsSection')}>
                        <div className={cx('sectionTitleBar')}>
                            <span className={cx('titleText')}>
                                SẢN PHẨM ĐÃ ĐẶT ({order.orderItems?.length || 0})
                            </span>
                            <span className={cx('currencyIndicator')}>ĐƠN VỊ: VND (₫)</span>
                        </div>

                        <div className={cx('productsTable')}>
                            {order.orderItems?.map((item, index) => (
                                <div key={index} className={cx('productRow')}>
                                    <Link
                                        to={`/product/${item.product}`}
                                        className={cx('productThumbnailFrame')}
                                        title={item.name}
                                    >
                                        <img src={item.image} alt={item.name} loading="lazy" />
                                    </Link>

                                    <div className={cx('productDetails')}>
                                        <Link
                                            to={`/product/${item.product}`}
                                            className={cx('productTitle')}
                                        >
                                            {item.name}
                                        </Link>
                                        <div className={cx('productMeta')}>
                                            <span className={cx('unitPrice')}>
                                                {Number(item.price).toLocaleString('vi-VN')} ₫
                                            </span>
                                            <span className={cx('divider')}>×</span>
                                            <span className={cx('quantity')}>Số lượng: {item.quantity}</span>
                                        </div>
                                    </div>

                                    <div className={cx('productTotal')}>
                                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className={cx('financialSection')}>
                        <div className={cx('finRow')}>
                            <span className={cx('finLabel')}>TẠM TÍNH</span>
                            <span className={cx('finValue')}>
                                {Number(order.itemsPrice || 0).toLocaleString('vi-VN')} ₫
                            </span>
                        </div>

                        {order.discount > 0 && (
                            <div className={cx('finRow', 'discountRow')}>
                                <span className={cx('finLabel')}>CHIẾT KHẤU / VOUCHER</span>
                                <span className={cx('finValue')}>
                                    -{Number(order.discount).toLocaleString('vi-VN')} ₫
                                </span>
                            </div>
                        )}

                        {order.taxPrice > 0 && (
                            <div className={cx('finRow')}>
                                <span className={cx('finLabel')}>THUẾ VAT (10%)</span>
                                <span className={cx('finValue')}>
                                    {Number(order.taxPrice).toLocaleString('vi-VN')} ₫
                                </span>
                            </div>
                        )}

                        <div className={cx('finRow')}>
                            <span className={cx('finLabel')}>PHÍ VẬN CHUYỂN</span>
                            <span className={cx('finValue')}>
                                {order.shippingPrice === 0
                                    ? 'MIỄN PHÍ'
                                    : `${Number(order.shippingPrice).toLocaleString('vi-VN')} ₫`}
                            </span>
                        </div>

                        <div className={cx('finRow', 'grandTotalRow')}>
                            <span className={cx('totalLabel')}>TỔNG THANH TOÁN</span>
                            <span className={cx('totalValue')}>
                                {Number(order.totalPrice).toLocaleString('vi-VN')} ₫
                            </span>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className={cx('actionsBar')}>
                        <Link to="/my-orders" className={cx('backLinkBtn')}>
                            <i className="fas fa-arrow-left"></i>
                            <span>DANH SÁCH ĐƠN HÀNG</span>
                        </Link>

                        <div className={cx('actionsRight')}>
                            <button
                                type="button"
                                className={cx('printBtn')}
                                onClick={handlePrintInvoice}
                                title="In biên lai / Hóa đơn"
                            >
                                <i className="fas fa-print"></i>
                                <span>IN HÓA ĐƠN</span>
                            </button>

                            {order.orderStatus === 'Processing' && (
                                <button
                                    type="button"
                                    className={cx('cancelBtn')}
                                    onClick={() => setShowConfirmCancel(true)}
                                    disabled={cancelling}
                                >
                                    <i className="fas fa-ban"></i>
                                    <span>{cancelling ? 'ĐANG HỦY...' : 'HỦY ĐƠN HÀNG'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Cancel Modal */}
            {showConfirmCancel && (
                <div
                    className={cx('modalOverlay')}
                    onClick={() => !cancelling && setShowConfirmCancel(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="order-cancel-title"
                >
                    <div
                        className={cx('modalCard')}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={cx('modalHeader')}>
                            <h3 id="order-cancel-title" className={cx('modalTitle')}>
                                XÁC NHẬN HỦY ĐƠN HÀNG
                            </h3>
                            <button
                                type="button"
                                className={cx('modalCloseBtn')}
                                onClick={() => setShowConfirmCancel(false)}
                                disabled={cancelling}
                                aria-label="Đóng"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className={cx('modalBody')}>
                            <p className={cx('modalMainText')}>
                                Bạn có chắc chắn muốn hủy đơn hàng <strong>#{order._id}</strong> không?
                            </p>
                            <p className={cx('modalSubText')}>
                                Toàn bộ sản phẩm sẽ được tự động hoàn lại vào kho hàng. Hành động này không thể hoàn tác sau khi xác nhận.
                            </p>
                        </div>
                        <div className={cx('modalFooter')}>
                            <button
                                type="button"
                                className={cx('modalSecondaryBtn')}
                                onClick={() => setShowConfirmCancel(false)}
                                disabled={cancelling}
                            >
                                GIỮ ĐƠN HÀNG
                            </button>
                            <button
                                type="button"
                                className={cx('modalPrimaryDangerBtn')}
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                            >
                                {cancelling ? 'ĐANG HỦY...' : 'XÁC NHẬN HỦY'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetail;
