import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import * as styles from './AdminUserDetail.module.scss';
import { API_URL } from '../../services/authService.js';
import { useAuth } from '../../context/AuthContext.js';
import { showToast } from '../../components/Toast/index.js';
import ThemeToggle from '../../components/ThemeToggle/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'Chờ xác nhận':
            return { label: 'Chờ xác nhận', className: cx('status-pending') };
        case 'Đang xử lý':
            return { label: 'Đang xử lý', className: cx('status-processing') };
        case 'Đang giao':
            return { label: 'Đang giao hàng', className: cx('status-delivering') };
        case 'Đã giao':
            return { label: 'Giao thành công', className: cx('status-delivered') };
        case 'Đã hủy':
            return { label: 'Đã hủy', className: cx('status-cancelled') };
        default:
            return { label: status || 'Không rõ', className: cx('status-pending') };
    }
};

function AdminUserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user: currentUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        email: '',
        phone: '',
        role: 'user',
        password: '',
        street: '',
        city: '',
        country: 'Việt Nam',
        zipCode: '',
        createdAt: null
    });

    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useHead(formData.name ? `Chi tiết người dùng: ${formData.name}` : 'Chi tiết tài khoản');

    // Tải thông tin chi tiết người dùng
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/users/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    withCredentials: true
                });

                if (response.data.success && response.data.user) {
                    const u = response.data.user;
                    const primaryAddress = Array.isArray(u.address) && u.address.length > 0 ? u.address[0] : (u.address || {});

                    setFormData({
                        _id: u._id || id,
                        name: u.name || '',
                        email: u.email || '',
                        phone: u.phoneNumber || u.phone || '',
                        role: u.role || 'user',
                        password: '',
                        street: primaryAddress.street || '',
                        city: primaryAddress.city || '',
                        country: primaryAddress.country || 'Việt Nam',
                        zipCode: primaryAddress.zipCode || '',
                        createdAt: u.createdAt || null
                    });
                } else {
                    showToast({
                        title: 'Lỗi',
                        message: 'Không tìm thấy người dùng trong hệ thống',
                        type: 'error'
                    });
                    navigate('/admin?tab=users', { state: { activeTab: 'users' } });
                }
            } catch (error) {
                console.error('Lỗi khi tải thông tin người dùng:', error);
                showToast({
                    title: 'Lỗi nạp dữ liệu',
                    message: error.response?.data?.message || 'Không thể lấy thông tin người dùng',
                    type: 'error'
                });
                navigate('/admin?tab=users', { state: { activeTab: 'users' } });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUserData();
        }
    }, [id, token, navigate]);

    // Tải danh sách đơn hàng của người dùng này
    useEffect(() => {
        const fetchUserOrders = async () => {
            if (!id || !token) return;
            setLoadingOrders(true);
            try {
                const response = await axios.get(`${API_URL}/orders/admin/orders?userId=${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                });

                if (response.data.success && Array.isArray(response.data.orders)) {
                    // Lọc đơn hàng thuộc user nếu endpoint trả về tất cả
                    const userOrders = response.data.orders.filter(order => {
                        const orderUserId = order.user?._id || order.user;
                        return String(orderUserId) === String(id);
                    });
                    setOrders(userOrders);
                }
            } catch (error) {
                console.error('Lỗi khi nạp đơn hàng của người dùng:', error);
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchUserOrders();
    }, [id, token]);

    // Lưu thông tin chỉnh sửa
    const handleSave = async (e) => {
        if (e) e.preventDefault();

        if (!formData.name.trim()) {
            showToast({
                title: 'Thiếu thông tin',
                message: 'Vui lòng nhập họ tên người dùng',
                type: 'warning'
            });
            return;
        }

        if (!formData.email.trim()) {
            showToast({
                title: 'Thiếu thông tin',
                message: 'Vui lòng nhập địa chỉ email hợp lệ',
                type: 'warning'
            });
            return;
        }

        if (formData.password && formData.password.length < 6) {
            showToast({
                title: 'Mật khẩu yếu',
                message: 'Mật khẩu mới phải có tối thiểu 6 ký tự',
                type: 'warning'
            });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                role: formData.role,
                phone: formData.phone.trim(),
                phoneNumber: formData.phone.trim(),
                address: [{
                    street: formData.street.trim(),
                    city: formData.city.trim(),
                    country: formData.country.trim() || 'Việt Nam',
                    zipCode: formData.zipCode.trim()
                }]
            };

            if (formData.password && formData.password.trim() !== '') {
                payload.password = formData.password.trim();
            }

            const response = await axios.put(`${API_URL}/users/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });

            if (response.data.success) {
                showToast({
                    title: 'Thành công',
                    message: 'Đã cập nhật thông tin người dùng thành công',
                    type: 'success'
                });
                setFormData(prev => ({ ...prev, password: '' }));
            } else {
                showToast({
                    title: 'Lỗi cập nhật',
                    message: response.data.message || 'Không thể cập nhật người dùng',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật người dùng:', error);
            showToast({
                title: 'Lỗi hệ thống',
                message: error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    // Xóa tài khoản người dùng
    const handleDelete = async () => {
        if (currentUser && String(currentUser._id || currentUser.id) === String(id)) {
            showToast({
                title: 'Thao tác bị chặn',
                message: 'Bạn không thể xóa tài khoản của chính mình!',
                type: 'warning'
            });
            return;
        }

        const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${formData.name}" vĩnh viễn không?`);
        if (!confirmed) return;

        setDeleting(true);
        try {
            const response = await axios.delete(`${API_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });

            if (response.data.success) {
                showToast({
                    title: 'Đã xóa',
                    message: `Tài khoản "${formData.name}" đã được xóa thành công`,
                    type: 'success'
                });
                navigate('/admin?tab=users', { state: { activeTab: 'users' } });
            } else {
                showToast({
                    title: 'Lỗi',
                    message: response.data.message || 'Không thể xóa tài khoản này',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Lỗi khi xóa người dùng:', error);
            showToast({
                title: 'Lỗi',
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng',
                type: 'error'
            });
        } finally {
            setDeleting(false);
        }
    };

    // Tính tổng tiền chi tiêu từ các đơn hàng thành công
    const totalSpent = orders
        .filter(o => o.orderStatus !== 'Đã hủy')
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    if (loading) {
        return (
            <div className={cx('page-wrapper')}>
                <div className={cx('container')}>
                    <div className={cx('loading-wrapper')}>
                        <div className={cx('spinner')} />
                        <span>Đang tải thông tin chi tiết người dùng...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('page-wrapper')}>
            <div className={cx('container')}>
                {/* Thanh điều hướng Breadcrumbs & Nút hành động */}
                <div className={cx('top-bar')}>
                    <div className={cx('breadcrumbs')}>
                        <Link
                            to="/admin?tab=users"
                            state={{ activeTab: 'users' }}
                            className={cx('back-link')}
                            title="Quay về Quản lý người dùng"
                        >
                            <i className="fas fa-arrow-left" />
                            Quản lý người dùng
                        </Link>
                        <span className={cx('separator')}>/</span>
                        <span className={cx('crumb-active')}>{formData.name || 'Người dùng'}</span>
                        <span className={cx('code-badge')}>
                            #{formData._id ? formData._id.slice(-6).toUpperCase() : 'ID'}
                        </span>
                        <span className={cx('role-badge', formData.role === 'admin' ? 'admin' : 'user')}>
                            <i className={formData.role === 'admin' ? 'fas fa-user-shield' : 'fas fa-user'} />
                            {formData.role === 'admin' ? 'ADMIN' : 'USER'}
                        </span>
                    </div>

                    <div className={cx('actions')}>
                        <ThemeToggle />

                        <button
                            type="button"
                            className={cx('btn-danger')}
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            <i className={`fas ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'}`} />
                            {deleting ? 'Đang xóa...' : 'Xóa tài khoản'}
                        </button>

                        <button
                            type="button"
                            className={cx('btn-primary')}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>

                {/* Bố cục Grid 2 cột: Cột chính + Cột tóm tắt hồ sơ */}
                <div className={cx('layout-grid')}>
                    {/* CỘT CHÍNH (BÊN TRÁI) */}
                    <div className={cx('main-column')}>
                        {/* Card 1: Thông tin tài khoản */}
                        <div className={cx('card')}>
                            <div className={cx('card-header')}>
                                <div className={cx('header-icon', 'icon-gold')}>
                                    <i className="fas fa-user-circle" />
                                </div>
                                <div className={cx('header-flex')}>
                                    <div>
                                        <h3 className={cx('card-title')}>Thông tin tài khoản</h3>
                                        <p className={cx('card-subtitle')}>Thông tin danh tính và quyền hạn người dùng</p>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('card-body')}>
                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>
                                            Họ và tên <span className={cx('required')}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            placeholder="Nhập họ và tên đầy đủ"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>
                                            Email liên kết <span className={cx('required')}>*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className={cx('input')}
                                            placeholder="example@domain.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Số điện thoại</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            placeholder="0912 345 678"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>
                                            Vai trò hệ thống <span className={cx('required')}>*</span>
                                        </label>
                                        <select
                                            className={cx('select')}
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="user">Người dùng (Khách hàng)</option>
                                            <option value="admin">Quản trị viên (Admin)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={cx('form-group')}>
                                    <label className={cx('label')}>Đặt lại mật khẩu mới</label>
                                    <input
                                        type="password"
                                        className={cx('input')}
                                        placeholder="Để trống nếu không muốn đổi mật khẩu"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <small className={cx('hint-text')}>
                                        Chỉ nhập vào ô này khi muốn đổi mật khẩu mới cho người dùng (tối thiểu 6 ký tự).
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Địa chỉ liên hệ & giao hàng */}
                        <div className={cx('card')}>
                            <div className={cx('card-header')}>
                                <div className={cx('header-icon', 'icon-blue')}>
                                    <i className="fas fa-map-marker-alt" />
                                </div>
                                <div className={cx('header-flex')}>
                                    <div>
                                        <h3 className={cx('card-title')}>Địa chỉ liên hệ & giao hàng</h3>
                                        <p className={cx('card-subtitle')}>Thông tin địa chỉ giao nhận của khách hàng</p>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('card-body')}>
                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Số nhà, tên đường</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            placeholder="Số 123 Đường Nguyễn Huệ, Phường Bến Nghé"
                                            value={formData.street}
                                            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                        />
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Thành phố / Tỉnh</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            placeholder="TP. Hồ Chí Minh"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Quốc gia</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            placeholder="Việt Nam"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        />
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Mã bưu chính (Zip code)</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            placeholder="700000"
                                            value={formData.zipCode}
                                            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Lịch sử đơn hàng của người dùng */}
                        <div className={cx('card')}>
                            <div className={cx('card-header')}>
                                <div className={cx('header-icon', 'icon-green')}>
                                    <i className="fas fa-shopping-bag" />
                                </div>
                                <div className={cx('header-flex')}>
                                    <div>
                                        <h3 className={cx('card-title')}>Lịch sử đơn hàng ({orders.length})</h3>
                                        <p className={cx('card-subtitle')}>Tất cả các đơn đặt hàng từ tài khoản này</p>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('card-body')}>
                                {loadingOrders ? (
                                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-secondary)' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '8px' }} />
                                        <p>Đang nạp danh sách đơn hàng...</p>
                                    </div>
                                ) : orders.length > 0 ? (
                                    <div className={cx('orders-table-wrapper')}>
                                        <table className={cx('orders-table')}>
                                            <thead>
                                                <tr>
                                                    <th>Mã đơn</th>
                                                    <th>Ngày đặt</th>
                                                    <th>Sản phẩm</th>
                                                    <th>Tổng tiền</th>
                                                    <th>Thanh toán</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map((order) => {
                                                    const badge = getStatusBadge(order.orderStatus);
                                                    const itemCount = Array.isArray(order.orderItems) ? order.orderItems.length : 0;
                                                    return (
                                                        <tr key={order._id}>
                                                            <td>
                                                                <span className={cx('order-code')}>
                                                                    #{order._id.slice(-6).toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td>{formatDate(order.createdAt)}</td>
                                                            <td>{itemCount} món</td>
                                                            <td>
                                                                <span className={cx('order-price')}>
                                                                    {formatPrice(order.totalPrice)}
                                                                </span>
                                                            </td>
                                                            <td>{order.paymentInfo?.method || 'COD'}</td>
                                                            <td>
                                                                <span className={cx('status-badge', badge.className)}>
                                                                    {badge.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={cx('no-orders-box')}>
                                        <i className="fas fa-box-open" />
                                        <p>Người dùng này chưa có đơn hàng nào</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHỤ (BÊN PHẢI) */}
                    <div className={cx('side-column')}>
                        {/* Hồ sơ tóm tắt */}
                        <div className={cx('profile-card')}>
                            <div className={cx('avatar-wrapper')}>
                                <div className={cx('avatar-large', formData.role === 'admin' ? 'admin' : '')}>
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className={cx('avatar-icon-badge', formData.role === 'admin' ? 'admin' : 'user')}>
                                    <i className={formData.role === 'admin' ? 'fas fa-shield-alt' : 'fas fa-user'} />
                                </span>
                            </div>

                            <h4 className={cx('profile-name')}>{formData.name || 'Người dùng'}</h4>
                            <p className={cx('profile-email')}>{formData.email}</p>

                            <span className={cx('role-badge', formData.role === 'admin' ? 'admin' : 'user')}>
                                {formData.role === 'admin' ? 'Quản trị viên (Admin)' : 'Khách hàng (User)'}
                            </span>

                            <div className={cx('profile-joined')}>
                                Tham gia: {formatDate(formData.createdAt)}
                            </div>

                            <div className={cx('stats-grid')}>
                                <div className={cx('stat-item')}>
                                    <span className={cx('stat-value')}>{orders.length}</span>
                                    <span className={cx('stat-label')}>Tổng đơn hàng</span>
                                </div>
                                <div className={cx('stat-item')}>
                                    <span className={cx('stat-value', 'gold')}>{formatPrice(totalSpent)}</span>
                                    <span className={cx('stat-label')}>Tổng chi tiêu</span>
                                </div>
                            </div>
                        </div>

                        {/* Thẻ lưu nhanh thao tác */}
                        <div className={cx('sticky-actions-card')}>
                            <h4 className={cx('actions-title')}>Thao tác tài khoản</h4>
                            <p className={cx('actions-desc')}>
                                Cập nhật thông tin phân quyền, địa chỉ hoặc mật khẩu cho người dùng này.
                            </p>

                            <button
                                type="button"
                                className={cx('save-btn-large')}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>

                            <button
                                type="button"
                                className={cx('cancel-btn-large')}
                                onClick={() => navigate('/admin?tab=users', { state: { activeTab: 'users' } })}
                            >
                                Quay lại danh sách
                            </button>

                            <button
                                type="button"
                                className={cx('danger-btn-large')}
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                <i className="fas fa-trash-alt" /> Xóa người dùng này
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminUserDetail;
