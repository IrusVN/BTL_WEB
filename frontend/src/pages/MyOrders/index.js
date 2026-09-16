import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as styles from './MyOrders.module.scss';
import classNames from 'classnames/bind';
import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import { showToast } from '../../components/Toast/index.js';
import { useAuth } from '../../context/AuthContext.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const OrderStatusBadge = ({ status }) => {
  let badgeClass = '';
  
  switch(status) {
    case 'Processing':
      badgeClass = 'statusProcessing';
      break;
    case 'Confirmed':
      badgeClass = 'statusConfirmed';
      break;
    case 'Shipping':
      badgeClass = 'statusShipping';
      break;
    case 'Delivered':
      badgeClass = 'statusDelivered';
      break;
    case 'Cancelled':
      badgeClass = 'statusCancelled';
      break;
    default:
      badgeClass = 'statusDefault';
  }
  
  return <span className={cx('statusBadge', badgeClass)}>{status}</span>;
};

const MyOrders = () => {
    useHead('Đơn hàng của tôi');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const cancelOrderBoxRef = useRef(null);
  
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
        const sortedOrders = response.data.orders.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
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
        message: 'Không thể tải danh sách đơn hàng',
        type: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  
  const openCancelConfirmation = (orderId) => {
    setSelectedOrderId(orderId);
    setShowConfirmModal(true);
  };
  
  const closeCancelConfirmation = () => {
    setShowConfirmModal(false);
    setSelectedOrderId(null);
  };
  
  const handleCancelOrder = async () => {
    if (!selectedOrderId) return;
    
    const confirmBtn = document.querySelector(`#confirm-cancel-btn`);
    if (confirmBtn) {
      confirmBtn.textContent = 'Đang xử lý...';
      confirmBtn.disabled = true;
    }
    
    try {
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
        
        setOrders(orders.map(order => 
          order._id === selectedOrderId ? { ...order, orderStatus: 'Cancelled' } : order
        ));
        
        closeCancelConfirmation();
      } else {
        showToast({
          title: 'Lỗi',
          message: 'Không thể hủy đơn hàng',
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
      const confirmBtn = document.querySelector(`#confirm-cancel-btn`);
      if (confirmBtn) {
        confirmBtn.textContent = 'Xác nhận hủy';
        confirmBtn.disabled = false;
      }
    }
  };
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  const getStatusVietnamese = (status) => {
    switch (status) {
      case 'Processing':
        return 'Đang xử lý';
      case 'Shipped':
        return 'Đang giao hàng';
      case 'Delivered':
        return 'Đã giao hàng';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing':
        return '#ff9800';
      case 'Shipped':
        return '#2196f3';
      case 'Delivered':
        return '#4caf50';
      case 'Cancelled':
        return '#f44336';
      default:
        return '#757575';
    }
  };
  
  const canCancelOrder = (status) => {
    return status === 'Processing';
  };
  
  useEffect(() => {
    if (showConfirmModal) {
      if (!document.getElementById("floating-cancel-box")) {
        const cancelBox = document.createElement('div');
        cancelBox.id = "floating-cancel-box";
        cancelBox.className = cx('floating-cancel-box');
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const boxWidth = 350;
        const boxHeight = 220;
        
        cancelBox.style.left = `${(windowWidth - boxWidth) / 2}px`;
        cancelBox.style.top = `${(windowHeight - boxHeight) / 2}px`;
        
        cancelBox.innerHTML = `
          <div class="${cx('cancel-box-header')}">
            <h3>Xác nhận hủy đơn hàng</h3>
            <button class="${cx('close-cancel-btn')}">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="${cx('cancel-box-content')}">
            <p>Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
            <p>Lưu ý: Hành động này không thể hoàn tác sau khi xác nhận.</p>
          </div>
          <div class="${cx('cancel-box-footer')}">
            <button class="${cx('close-button')}" id="close-cancel-btn">
              Đóng
            </button>
            <button class="${cx('confirm-button')}" id="confirm-cancel-btn">
              Xác nhận hủy
            </button>
          </div>
        `;
        
        document.body.appendChild(cancelBox);
        
        cancelOrderBoxRef.current = cancelBox;
        
        const closeBtn = cancelBox.querySelector(`.${cx('close-cancel-btn')}`);
        if (closeBtn) {
          closeBtn.addEventListener('click', closeCancelConfirmation);
        }
        
        const closeCancelBtn = cancelBox.querySelector('#close-cancel-btn');
        if (closeCancelBtn) {
          closeCancelBtn.addEventListener('click', closeCancelConfirmation);
        }
        
        const confirmBtn = cancelBox.querySelector('#confirm-cancel-btn');
        if (confirmBtn) {
          confirmBtn.addEventListener('click', handleCancelOrder);
        }
        
        const header = cancelBox.querySelector(`.${cx('cancel-box-header')}`);
        if (header) {
          let isDragging = false;
          let offsetX, offsetY;
          
          header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = cancelBox.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            header.classList.add(cx('dragging'));
          });
          
          document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            
            const maxX = window.innerWidth - cancelBox.offsetWidth;
            const maxY = window.innerHeight - cancelBox.offsetHeight;
            
            cancelBox.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            cancelBox.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
          });
          
          document.addEventListener('mouseup', () => {
            if (isDragging) {
              isDragging = false;
              header.classList.remove(cx('dragging'));
            }
          });
        }
      }
    } else {
      const cancelBox = document.getElementById("floating-cancel-box");
      if (cancelBox) {
        cancelBox.remove();
        cancelOrderBoxRef.current = null;
      }
    }
  }, [showConfirmModal, selectedOrderId]);
  
  return (
    <div className={cx('myOrdersPage')}>
      <div className={cx('container')}>
        <div className={cx('pageHeader')}>
          <h1>Đơn hàng của tôi</h1>
          <p>Quản lý và theo dõi tất cả đơn hàng của bạn</p>
        </div>
        
        {loading ? (
          <div className={cx('loadingSection')}>
            <div className={cx('spinner')}></div>
            <p>Đang tải đơn hàng...</p>
          </div>
        ) : error ? (
          <div className={cx('error')}>{error}</div>
        ) : orders.length === 0 ? (
          <div className={cx('emptyOrders')}>
            <div className={cx('emptyIcon')}>
              <i className="fas fa-shopping-basket"></i>
            </div>
            <h2>Bạn chưa có đơn hàng nào</h2>
            <p>Hãy mua sắm và quay lại đây để theo dõi đơn hàng của bạn</p>
            <Link to="/products" className={cx('shopNowBtn')}>
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className={cx('ordersContainer')}>
            {orders.map((order) => (
              <div key={order._id} className={cx('orderCard')}>
                <div className={cx('orderHeader')}>
                  <div className={cx('orderInfo')}>
                    <div className={cx('orderId')}>
                      <span className={cx('label')}>Mã đơn hàng:</span>
                      <span className={cx('value')}>{order._id}</span>
                    </div>
                    <div className={cx('orderDate')}>
                      <span className={cx('label')}>Ngày đặt:</span>
                      <span className={cx('value')}>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className={cx('orderStatus')}>
                    <span
                      className={cx('statusBadge')}
                      style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                      title={order.cancelledBy === 'admin' ? `Đã hủy bởi Admin: ${order.cancelledByUserName || 'Admin'} vào ${formatDate(order.cancelledAt)}` : ''}
                    >
                      {getStatusVietnamese(order.orderStatus)}
                      {order.cancelledBy === 'admin' && order.orderStatus === 'Cancelled' && 
                        <span className={cx('cancelInfo')}> (Bởi Admin)</span>
                      }
                    </span>
                  </div>
                </div>
                
                <div className={cx('orderBody')}>
                  <div className={cx('orderItems')}>
                    {order.orderItems.slice(0, 2).map((item, index) => (
                      <div key={index} className={cx('orderItem')}>
                        <div className={cx('itemImage')}>
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className={cx('itemDetails')}>
                          <div className={cx('itemName')}>{item.name}</div>
                          <div className={cx('itemQuantity')}>x{item.quantity}</div>
                          <div className={cx('itemPrice')}>{item.price.toLocaleString('vi-VN')} VND</div>
                        </div>
                      </div>
                    ))}
                    
                    {order.orderItems.length > 2 && (
                      <div className={cx('moreItems')}>
                        +{order.orderItems.length - 2} sản phẩm khác
                      </div>
                    )}
                  </div>
                  
                  <div className={cx('orderTotal')}>
                    <div className={cx('totalAmount')}>
                      <span className={cx('label')}>Tổng tiền:</span>
                      <span className={cx('value')}>{order.totalPrice.toLocaleString('vi-VN')} VND</span>
                    </div>
                    <div className={cx('paymentMethod')}>
                      <span className={cx('label')}>Thanh toán:</span>
                      <span className={cx('value')}>{order.paymentInfo.method}</span>
                    </div>
                    <div className={cx('paymentStatus')}>
                      <span className={cx('label')}>Trạng thái:</span>
                      <span className={cx('value')}>{order.paymentInfo.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className={cx('orderFooter')}>
                  <Link to={`/order/${order._id}`} className={cx('viewDetailsBtn')}>
                    <i className="fas fa-eye"></i> Xem chi tiết
                  </Link>
                  {canCancelOrder(order.orderStatus) && (
                    <button 
                      className={cx('cancelOrderBtn')}
                      onClick={() => openCancelConfirmation(order._id)}
                      disabled={cancelLoading}
                    >
                      <i className="fas fa-ban"></i> Hủy đơn hàng
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders; 