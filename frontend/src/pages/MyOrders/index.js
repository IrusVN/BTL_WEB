import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as styles from './MyOrders.module.scss';
import classNames from 'classnames/bind';
import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import { useAuth } from '../../context/AuthContext.js';
import Breadcrumb from '../../components/Breadcrumb/index.js';
import AccountNav from '../../components/AccountNav/index.js';
import QuickView from '../../components/QuickView/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const STATUS_TABS = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'Processing', label: 'Đang xử lý' },
    { key: 'Confirmed', label: 'Đã xác nhận' },
    { key: 'Shipping', label: 'Đang giao hàng' },
    { key: 'Delivered', label: 'Đã giao hàng' },
    { key: 'Cancelled', label: 'Đã hủy' }
];

const OrderStatusBadge = ({ status, cancelledBy, cancelledByUserName, cancelledAt }) => {
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
        <span
            className={cx('statusBadge', statusClass)}
            title={cancelledBy === 'admin' ? `Đã hủy bởi Quản trị viên: ${cancelledByUserName || 'Admin'}` : ''}
        >
            <span className={cx('statusDot')}></span>
            {statusLabel}
            {cancelledBy === 'admin' && status === 'Cancelled' && (
                <span className={cx('adminCancelNote')}> (Bởi Admin)</span>
            )}
        </span>
    );
};

const MyOrders = () => {
    useHead('Đơn hàng của tôi | Team2hand');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    // QuickView & BottomSheet State
    const [selectedOrderForQuickView, setSelectedOrderForQuickView] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchOrders();
    }, [navigate, user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(`${API_URL}/orders/orders/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });

            if (response.data.success) {
                const sortedOrders = (response.data.orders || []).sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setOrders(sortedOrders);
            } else {
                showToast({
                    title: 'Lỗi',
                    message: 'Không thể tải danh sách đơn hàng',
                    type: 'error',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
            showToast({
                title: 'Lỗi',
                message: 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.',
                type: 'error',
                duration: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenQuickView = (order) => {
        setSelectedOrderForQuickView(order);
        setIsQuickViewOpen(true);
    };

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false);
        setSelectedOrderForQuickView(null);
    };

    const handleCopyOrderId = (id) => {
        if (!id) return;
        navigator.clipboard.writeText(id);
        setCopiedId(true);
        showToast({
            title: 'Đã sao chép',
            message: `Mã đơn hàng #${id} đã được lưu vào bộ nhớ tạm`,
            type: 'success',
            duration: 2500
        });
        setTimeout(() => setCopiedId(false), 2000);
    };

    const getOrderStepIndex = (status) => {
        if (status === 'Cancelled') return -1;
        const steps = ['Processing', 'Confirmed', 'Shipping', 'Delivered'];
        const normalized = status === 'Shipped' ? 'Shipping' : status;
        return steps.indexOf(normalized);
    };

    const openCancelConfirmation = (orderId) => {
        setSelectedOrderId(orderId);
        setShowConfirmModal(true);
    };

    const closeCancelConfirmation = () => {
        if (cancelLoading) return;
        setShowConfirmModal(false);
        setSelectedOrderId(null);
    };

    const handleCancelOrder = async () => {
        if (!selectedOrderId) return;

        try {
            setCancelLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.put(
                `${API_URL}/orders/order/${selectedOrderId}/cancel`,
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
                showToast({
                    title: 'Thành công',
                    message: 'Đơn hàng đã được hủy thành công',
                    type: 'success',
                    duration: 3000
                });

                setOrders((prevOrders) =>
                    prevOrders.map((order) =>
                        order._id === selectedOrderId ? { ...order, orderStatus: 'Cancelled' } : order
                    )
                );

                if (selectedOrderForQuickView && selectedOrderForQuickView._id === selectedOrderId) {
                    setSelectedOrderForQuickView((prev) =>
                        prev ? { ...prev, orderStatus: 'Cancelled' } : null
                    );
                }

                closeCancelConfirmation();
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
                message: error.response?.data?.message || 'Không thể hủy đơn hàng lúc này',
                type: 'error',
                duration: 3000
            });
        } finally {
            setCancelLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const canCancelOrder = (status) => {
        return status === 'Processing';
    };

    const filteredOrders = orders.filter((order) => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'Shipping') {
            return order.orderStatus === 'Shipping' || order.orderStatus === 'Shipped';
        }
        return order.orderStatus === activeFilter;
    });

    const getStatusCount = (key) => {
        if (key === 'ALL') return orders.length;
        if (key === 'Shipping') {
            return orders.filter((o) => o.orderStatus === 'Shipping' || o.orderStatus === 'Shipped').length;
        }
        return orders.filter((o) => o.orderStatus === key).length;
    };

    return (
        <div className={cx('myOrdersPage')}>
            <div className={cx('container')}>
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        { label: 'Trang chủ', to: '/' },
                        { label: 'Đơn hàng của tôi' }
                    ]}
                />

                {/* Sub-navigation Tabs */}
                <AccountNav />

                {/* Page Title Header */}
                <div className={cx('pageHeader')}>
                    <div className={cx('headerMain')}>
                        <h1 className={cx('pageTitle')}>ĐƠN HÀNG CỦA TÔI</h1>
                        <p className={cx('pageDesc')}>
                            Quản lý lịch sử mua hàng, chi tiết thanh toán và trạng thái vận chuyển
                        </p>
                    </div>
                    <div className={cx('orderCountBadge')}>
                        <span className={cx('countValue')}>{orders.length}</span> ĐƠN HÀNG
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className={cx('filterBar')}>
                    <div className={cx('filterTabs')}>
                        {STATUS_TABS.map((tab) => {
                            const count = getStatusCount(tab.key);
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    className={cx('filterTab', { active: activeFilter === tab.key })}
                                    onClick={() => setActiveFilter(tab.key)}
                                >
                                    <span>{tab.label}</span>
                                    <span className={cx('tabBadge')}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Orders Content */}
                {loading ? (
                    <div className={cx('loadingSection')}>
                        <div className={cx('spinner')}></div>
                        <p>Đang đồng bộ dữ liệu đơn hàng...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className={cx('emptyOrdersCard')}>
                        <div className={cx('emptyIcon')}>
                            <i className="fas fa-box-open"></i>
                        </div>
                        <h2 className={cx('emptyTitle')}>
                            {activeFilter === 'ALL'
                                ? 'BẠN CHƯA CÓ ĐƠN HÀNG NÀO'
                                : `KHÔNG CÓ ĐƠN HÀNG Ở MỤC "${STATUS_TABS.find((t) => t.key === activeFilter)?.label.toUpperCase()}"`}
                        </h2>
                        <p className={cx('emptyDesc')}>
                            {activeFilter === 'ALL'
                                ? 'Các tuyệt tác thời trang bạn chọn mua sẽ được lưu trữ và cập nhật trạng thái tại đây.'
                                : 'Bạn có thể chọn xem tất cả đơn hàng hoặc khám phá thêm các bộ sưu tập mới.'}
                        </p>
                        <Link to="/products" className={cx('shopNowBtn')}>
                            <span>KHÁM PHÁ BỘ SƯU TẬP</span>
                        </Link>
                    </div>
                ) : (
                    <div className={cx('ordersList')}>
                        {filteredOrders.map((order) => (
                            <div key={order._id} className={cx('orderCard')}>
                                {/* Card Header */}
                                <div className={cx('orderHeader')}>
                                    <div className={cx('orderMetaGroup')}>
                                        <div
                                            className={cx('orderIdTag')}
                                            onClick={() => handleOpenQuickView(order)}
                                            style={{ cursor: 'pointer' }}
                                            title="Bấm để xem nhanh đơn hàng"
                                        >
                                            <span className={cx('idLabel')}>MÃ ĐƠN:</span>
                                            <span className={cx('idValue')}>#{order._id}</span>
                                        </div>
                                        <span className={cx('metaDivider')}>•</span>
                                        <div className={cx('orderDateTag')}>
                                            <i className="far fa-clock"></i>
                                            <span>{formatDate(order.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className={cx('orderStatusWrap')}>
                                        <OrderStatusBadge
                                            status={order.orderStatus}
                                            cancelledBy={order.cancelledBy}
                                            cancelledByUserName={order.cancelledByUserName}
                                            cancelledAt={order.cancelledAt}
                                        />
                                    </div>
                                </div>

                                {/* Card Body (Items preview) */}
                                <div className={cx('orderBody')}>
                                    <div className={cx('orderItems')}>
                                        {order.orderItems?.slice(0, 3).map((item, index) => (
                                            <div key={index} className={cx('orderItemRow')}>
                                                <Link
                                                    to={`/product/${item.product}`}
                                                    className={cx('itemImageFrame')}
                                                    title={item.name}
                                                >
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        loading="lazy"
                                                    />
                                                </Link>
                                                <div className={cx('itemDetails')}>
                                                    <Link
                                                        to={`/product/${item.product}`}
                                                        className={cx('itemName')}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    <div className={cx('itemMeta')}>
                                                        <span className={cx('itemUnitPrice')}>
                                                            {Number(item.price).toLocaleString('vi-VN')} ₫
                                                        </span>
                                                        <span className={cx('metaCross')}>×</span>
                                                        <span className={cx('itemQty')}>SL: {item.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className={cx('itemLineTotal')}>
                                                    {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                                </div>
                                            </div>
                                        ))}

                                        {order.orderItems?.length > 3 && (
                                            <div className={cx('moreItemsNote')}>
                                                <button
                                                    type="button"
                                                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-gold)' }}
                                                    onClick={() => handleOpenQuickView(order)}
                                                >
                                                    + {order.orderItems.length - 3} sản phẩm khác trong đơn hàng (Xem nhanh)
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Summary & Financials */}
                                    <div className={cx('orderSummarySidebar')}>
                                        <div className={cx('summaryRow')}>
                                            <span className={cx('sumLabel')}>PHƯƠNG THỨC:</span>
                                            <span className={cx('sumValue')}>
                                                {order.paymentInfo?.method === 'Banking'
                                                    ? 'Chuyển khoản'
                                                    : 'COD (Tiền mặt)'}
                                            </span>
                                        </div>
                                        <div className={cx('summaryRow')}>
                                            <span className={cx('sumLabel')}>THANH TOÁN:</span>
                                            <span
                                                className={cx('paymentTag', {
                                                    isPaid: order.paymentInfo?.status === 'Đã thanh toán'
                                                })}
                                            >
                                                {order.paymentInfo?.status === 'Đã thanh toán'
                                                    ? 'Đã thanh toán'
                                                    : 'Chờ thanh toán'}
                                            </span>
                                        </div>
                                        <div className={cx('summaryTotalRow')}>
                                            <span className={cx('totalLabel')}>TỔNG TIỀN:</span>
                                            <span className={cx('totalAmount')}>
                                                {Number(order.totalPrice).toLocaleString('vi-VN')} ₫
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer Actions */}
                                <div className={cx('orderFooter')}>
                                    <div className={cx('footerActionLeft')}>
                                        {canCancelOrder(order.orderStatus) && (
                                            <button
                                                type="button"
                                                className={cx('cancelOrderBtn')}
                                                onClick={() => openCancelConfirmation(order._id)}
                                            >
                                                <span>HỦY ĐƠN HÀNG</span>
                                            </button>
                                        )}
                                    </div>
                                    <div className={cx('footerActionRight')}>
                                        <button
                                            type="button"
                                            className={cx('quickViewBtn')}
                                            onClick={() => handleOpenQuickView(order)}
                                        >
                                            <i className="fas fa-eye"></i>
                                            <span>XEM NHANH BIÊN LAI</span>
                                        </button>
                                        <Link
                                            to={`/order/${order._id}`}
                                            className={cx('fullDetailLink')}
                                            title="Mở trang chi tiết đầy đủ"
                                        >
                                            <i className="fas fa-external-link-alt"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* QuickView & BottomSheet Drawer for Fast Order Inspection */}
            <QuickView
                isOpen={isQuickViewOpen}
                onClose={handleCloseQuickView}
                title={
                    selectedOrderForQuickView
                        ? `ĐƠN HÀNG #${selectedOrderForQuickView._id.slice(-8).toUpperCase()}`
                        : ''
                }
                subtitle={
                    selectedOrderForQuickView
                        ? `Khởi tạo lúc ${formatDate(selectedOrderForQuickView.createdAt)}`
                        : ''
                }
                extraHeader={
                    selectedOrderForQuickView && (
                        <OrderStatusBadge
                            status={selectedOrderForQuickView.orderStatus}
                            cancelledBy={selectedOrderForQuickView.cancelledBy}
                            cancelledByUserName={selectedOrderForQuickView.cancelledByUserName}
                            cancelledAt={selectedOrderForQuickView.cancelledAt}
                        />
                    )
                }
                width="640px"
                footer={
                    selectedOrderForQuickView && (
                        <div className={cx('quickViewFooterContent')}>
                            <div className={cx('quickViewFooterLeft')}>
                                {canCancelOrder(selectedOrderForQuickView.orderStatus) && (
                                    <button
                                        type="button"
                                        className={cx('quickViewCancelBtn')}
                                        onClick={() => openCancelConfirmation(selectedOrderForQuickView._id)}
                                    >
                                        <i className="fas fa-ban"></i>
                                        <span>HỦY ĐƠN HÀNG</span>
                                    </button>
                                )}
                            </div>
                            <div className={cx('quickViewFooterRight')}>
                                <Link
                                    to={`/order/${selectedOrderForQuickView._id}`}
                                    className={cx('quickViewFullLink')}
                                    onClick={handleCloseQuickView}
                                >
                                    <span>TRANG ĐẦY ĐỦ</span>
                                    <i className="fas fa-external-link-alt"></i>
                                </Link>
                                <button
                                    type="button"
                                    className={cx('quickViewCloseBtn')}
                                    onClick={handleCloseQuickView}
                                >
                                    <span>ĐÓNG</span>
                                </button>
                            </div>
                        </div>
                    )
                }
            >
                {selectedOrderForQuickView && (
                    <div className={cx('quickViewContent')}>
                        {/* Full Order Reference & Copy Bar */}
                        <div className={cx('orderRefBar')}>
                            <div className={cx('refIdentity')}>
                                <span className={cx('refLabel')}>MÃ ĐƠN TOÀN BỘ:</span>
                                <span className={cx('refValue')}>#{selectedOrderForQuickView._id}</span>
                                <button
                                    type="button"
                                    className={cx('copyBtn')}
                                    onClick={() => handleCopyOrderId(selectedOrderForQuickView._id)}
                                    title="Sao chép mã đơn hàng"
                                >
                                    <i className={copiedId ? 'fas fa-check' : 'far fa-copy'}></i>
                                    <span>{copiedId ? 'Đã sao chép' : 'Sao chép'}</span>
                                </button>
                            </div>
                            <div className={cx('refDate')}>
                                <i className="far fa-clock"></i>
                                <span>{formatDate(selectedOrderForQuickView.createdAt)}</span>
                            </div>
                        </div>

                        {/* Stepper or Cancelled Alert Banner */}
                        {selectedOrderForQuickView.orderStatus === 'Cancelled' ? (
                            <div className={cx('quickViewCancelledBanner')}>
                                <div className={cx('cancelledIcon')}>
                                    <i className="fas fa-ban"></i>
                                </div>
                                <div className={cx('cancelledContent')}>
                                    <h4>ĐƠN HÀNG ĐÃ BỊ HỦY</h4>
                                    <p>
                                        Đơn hàng này đã kết thúc xử lý. Toàn bộ sản phẩm đã được tự động hoàn lại vào kho.
                                        {selectedOrderForQuickView.cancelledBy === 'admin'
                                            ? ` (Đã hủy bởi Quản trị viên${selectedOrderForQuickView.cancelledByUserName ? `: ${selectedOrderForQuickView.cancelledByUserName}` : ''})`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className={cx('quickViewStepperSection')}>
                                <span className={cx('stepperTitle')}>TIẾN TRÌNH XỬ LÝ ĐƠN HÀNG</span>
                                <div className={cx('stepperTrack')}>
                                    {[
                                        { step: 1, key: 'Processing', label: 'Chờ xử lý', icon: 'fas fa-receipt' },
                                        { step: 2, key: 'Confirmed', label: 'Đã xác nhận', icon: 'fas fa-check-circle' },
                                        { step: 3, key: 'Shipping', label: 'Đang giao', icon: 'fas fa-shipping-fast' },
                                        { step: 4, key: 'Delivered', label: 'Đã giao', icon: 'fas fa-box' }
                                    ].map((s, idx) => {
                                        const stepIdx = getOrderStepIndex(selectedOrderForQuickView.orderStatus);
                                        const isComplete = stepIdx > idx;
                                        const isCurrent = stepIdx === idx;
                                        return (
                                            <div
                                                key={s.key}
                                                className={cx('stepItem', {
                                                    complete: isComplete,
                                                    current: isCurrent
                                                })}
                                            >
                                                <div className={cx('stepDot')}>
                                                    {isComplete ? (
                                                        <i className="fas fa-check"></i>
                                                    ) : (
                                                        <i className={s.icon}></i>
                                                    )}
                                                </div>
                                                <span className={cx('stepText')}>{s.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2-Column Info Grid */}
                        <div className={cx('quickViewGrid')}>
                            {/* Shipping Information Card */}
                            <div className={cx('quickViewCard')}>
                                <div className={cx('cardHeading')}>
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>THÔNG TIN GIAO HÀNG</span>
                                </div>
                                <div className={cx('cardContent')}>
                                    <p className={cx('recipientName')}>
                                        {selectedOrderForQuickView.shippingInfo?.fullName || 'Khách hàng'}
                                    </p>
                                    <p className={cx('recipientLine')}>
                                        SĐT: <span>{selectedOrderForQuickView.shippingInfo?.phoneNo || '—'}</span>
                                    </p>
                                    <p className={cx('recipientLine')}>
                                        Địa chỉ: <span>{selectedOrderForQuickView.shippingInfo?.address}, {selectedOrderForQuickView.shippingInfo?.city}</span>
                                    </p>
                                    {selectedOrderForQuickView.shippingInfo?.notes && (
                                        <p className={cx('recipientLine')}>
                                            Ghi chú: <span>{selectedOrderForQuickView.shippingInfo.notes}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Payment Information Card */}
                            <div className={cx('quickViewCard')}>
                                <div className={cx('cardHeading')}>
                                    <i className="fas fa-credit-card"></i>
                                    <span>PHƯƠNG THỨC THANH TOÁN</span>
                                </div>
                                <div className={cx('cardContent')}>
                                    <div className={cx('contentRow')}>
                                        <span className={cx('fieldLabel')}>Hình thức:</span>
                                        <span className={cx('fieldValue')}>
                                            {selectedOrderForQuickView.paymentInfo?.method === 'Banking'
                                                ? 'Chuyển khoản ngân hàng'
                                                : 'Thanh toán COD'}
                                        </span>
                                    </div>
                                    <div className={cx('contentRow')}>
                                        <span className={cx('fieldLabel')}>Trạng thái:</span>
                                        <span
                                            className={cx('paymentTag', {
                                                isPaid: selectedOrderForQuickView.paymentInfo?.status === 'Đã thanh toán'
                                            })}
                                        >
                                            {selectedOrderForQuickView.paymentInfo?.status === 'Đã thanh toán'
                                                ? 'Đã thanh toán'
                                                : 'Chờ thanh toán'}
                                        </span>
                                    </div>
                                    {selectedOrderForQuickView.paidAt && (
                                        <div className={cx('contentRow')}>
                                            <span className={cx('fieldLabel')}>Thời gian TT:</span>
                                            <span className={cx('fieldValue')}>
                                                {formatDate(selectedOrderForQuickView.paidAt)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Items Manifest Section */}
                        <div className={cx('quickViewSection')}>
                            <div className={cx('sectionHeader')}>
                                <div className={cx('sectionTitleGroup')}>
                                    <i className="fas fa-shopping-bag"></i>
                                    <h4>DANH SÁCH SẢN PHẨM</h4>
                                </div>
                                <span className={cx('itemCount')}>
                                    {selectedOrderForQuickView.orderItems?.length || 0} sản phẩm
                                </span>
                            </div>
                            <div className={cx('itemsContainer')}>
                                {selectedOrderForQuickView.orderItems?.map((item, idx) => (
                                    <div key={idx} className={cx('quickViewItemRow')}>
                                        <Link
                                            to={`/product/${item.product}`}
                                            className={cx('itemThumb')}
                                            onClick={handleCloseQuickView}
                                            title={item.name}
                                        >
                                            <img src={item.image} alt={item.name} loading="lazy" />
                                        </Link>
                                        <div className={cx('itemInfo')}>
                                            <Link
                                                to={`/product/${item.product}`}
                                                className={cx('itemLink')}
                                                onClick={handleCloseQuickView}
                                            >
                                                {item.name}
                                            </Link>
                                            <div className={cx('itemPricing')}>
                                                <span>{Number(item.price).toLocaleString('vi-VN')} ₫</span>
                                                <span className={cx('cross')}>×</span>
                                                <span>{item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className={cx('itemTotal')}>
                                            {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Financials Breakdown Card */}
                        <div className={cx('quickViewFinancialCard')}>
                            <div className={cx('finRow')}>
                                <span className={cx('finLabel')}>Tạm tính:</span>
                                <span className={cx('finValue')}>
                                    {Number(selectedOrderForQuickView.itemsPrice || selectedOrderForQuickView.totalPrice).toLocaleString('vi-VN')} ₫
                                </span>
                            </div>
                            <div className={cx('finRow', { freeShipping: !selectedOrderForQuickView.shippingPrice })}>
                                <span className={cx('finLabel')}>Phí vận chuyển:</span>
                                <span className={cx('finValue')}>
                                    {selectedOrderForQuickView.shippingPrice > 0
                                        ? `${Number(selectedOrderForQuickView.shippingPrice).toLocaleString('vi-VN')} ₫`
                                        : 'Miễn phí'}
                                </span>
                            </div>
                            <div className={cx('finTotalRow')}>
                                <span className={cx('totalTitle')}>TỔNG THANH TOÁN:</span>
                                <span className={cx('totalPrice')}>
                                    {Number(selectedOrderForQuickView.totalPrice).toLocaleString('vi-VN')} ₫
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </QuickView>

            {/* Standard React Cancellation Modal (Replacing previous innerHTML DOM anti-pattern) */}
            {showConfirmModal && (
                <div
                    className={cx('modalOverlay')}
                    onClick={closeCancelConfirmation}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cancel-modal-title"
                >
                    <div
                        className={cx('modalCard')}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={cx('modalHeader')}>
                            <h3 id="cancel-modal-title" className={cx('modalTitle')}>
                                XÁC NHẬN HỦY ĐƠN HÀNG
                            </h3>
                            <button
                                type="button"
                                className={cx('modalCloseBtn')}
                                onClick={closeCancelConfirmation}
                                disabled={cancelLoading}
                                aria-label="Đóng"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className={cx('modalBody')}>
                            <p className={cx('modalMainText')}>
                                Bạn có chắc chắn muốn hủy đơn hàng <strong>#{selectedOrderId}</strong>?
                            </p>
                            <p className={cx('modalSubText')}>
                                Số lượng sản phẩm sẽ được tự động hoàn lại vào kho. Hành động này không thể hoàn tác sau khi xác nhận.
                            </p>
                        </div>
                        <div className={cx('modalFooter')}>
                            <button
                                type="button"
                                className={cx('modalSecondaryBtn')}
                                onClick={closeCancelConfirmation}
                                disabled={cancelLoading}
                            >
                                GIỮ ĐƠN HÀNG
                            </button>
                            <button
                                type="button"
                                className={cx('modalPrimaryDangerBtn')}
                                onClick={handleCancelOrder}
                                disabled={cancelLoading}
                            >
                                {cancelLoading ? 'ĐANG HỦY...' : 'XÁC NHẬN HỦY'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;
