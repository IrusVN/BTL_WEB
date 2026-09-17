import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import * as styles from './AdminProductDetail.module.scss';
import { API_URL } from '../../services/authService.js';
import { uploadProductImages } from '../../services/productService.js';
import { useAuth } from '../../context/AuthContext.js';
import { showToast } from '../../components/Toast/index.js';
import ImageLightbox from '../../components/ImageLightbox/index.js';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const POPULAR_BRANDS = [
    'PRADA',
    'DIOR',
    'GUCCI',
    'LOUIS VUITTON',
    'NIKE',
    'ADIDAS',
    'BALENCIAGA'
];

const CATEGORIES = [
    { value: 'shirt', label: 'Áo (Shirt / T-Shirt / Hoodie)' },
    { value: 'pants', label: 'Quần (Pants / Shorts)' },
    { value: 'shoes', label: 'Giày (Shoes / Sneakers)' },
    { value: 'accessories', label: 'Phụ kiện (Accessories)' }
];

function AdminProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        code: '',
        price: 0,
        stock: 1,
        description: '',
        brand: '',
        category: '',
        gioiTinh: 'Nam',
        mauSac: '',
        kieuDang: '',
        chatLieu: '',
        xuatXu: '',
        size: '',
        images: []
    });

    useHead(formData.name ? `Chỉnh sửa: ${formData.name}` : 'Chỉnh sửa chi tiết sản phẩm');

    // Tải dữ liệu sản phẩm
    useEffect(() => {
        const fetchProductDetail = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/products/product/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    withCredentials: true
                });

                if (response.data.success && response.data.product) {
                    const p = response.data.product;
                    setFormData({
                        _id: p._id || id,
                        name: p.name || '',
                        code: p.code || '',
                        price: p.price || 0,
                        stock: p.stock ?? 1,
                        description: p.description || '',
                        brand: p.brand || '',
                        category: p.category || '',
                        gioiTinh: p.gioiTinh || 'Nam',
                        mauSac: p.mauSac || '',
                        kieuDang: p.kieuDang || '',
                        chatLieu: p.chatLieu || '',
                        xuatXu: p.xuatXu || '',
                        size: p.size || '',
                        images: p.images || []
                    });
                } else {
                    showToast({
                        title: 'Lỗi',
                        message: 'Không tìm thấy thông tin sản phẩm!',
                        type: 'error',
                        duration: 3000
                    });
                }
            } catch (err) {
                console.error('Lỗi khi tải thông tin sản phẩm:', err);
                showToast({
                    title: 'Lỗi kết nối',
                    message: 'Không thể tải chi tiết sản phẩm. Vui lòng thử lại!',
                    type: 'error',
                    duration: 3000
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProductDetail();
        }
    }, [id, token]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Tải ảnh trực tiếp lên Cloudflare R2
    const handleUploadImages = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploading(true);
        showToast({
            title: 'Đang tải ảnh',
            message: `Đang tải ${files.length} ảnh lên Cloudflare R2...`,
            type: 'info',
            duration: 3000
        });

        try {
            const data = await uploadProductImages(files, token);
            if (data.success && data.images) {
                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), ...data.images]
                }));
                showToast({
                    title: 'Thành công',
                    message: `Đã tải ${data.images.length} ảnh lên Cloudflare R2 thành công!`,
                    type: 'success',
                    duration: 3000
                });
            }
        } catch (err) {
            console.error('Lỗi khi tải ảnh lên R2:', err);
            showToast({
                title: 'Lỗi tải ảnh',
                message: err.message || 'Không thể tải ảnh lên Cloudflare R2',
                type: 'error',
                duration: 4000
            });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // Xóa một ảnh khỏi danh sách
    const handleRemoveImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    // Đặt ảnh làm ảnh đại diện chính (đưa lên đầu danh sách)
    const handleSetPrimaryImage = (indexToPrimary) => {
        setFormData(prev => {
            const updated = [...prev.images];
            const [selected] = updated.splice(indexToPrimary, 1);
            updated.unshift(selected);
            return {
                ...prev,
                images: updated
            };
        });
        showToast({
            title: 'Ảnh đại diện',
            message: 'Đã đặt làm ảnh chính của sản phẩm',
            type: 'info',
            duration: 2000
        });
    };

    // Lưu chi tiết sản phẩm
    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast({
                title: 'Thiếu thông tin',
                message: 'Vui lòng nhập tên sản phẩm',
                type: 'error',
                duration: 3000
            });
            return;
        }

        if (formData.price < 0 || isNaN(formData.price)) {
            showToast({
                title: 'Giá không hợp lệ',
                message: 'Vui lòng nhập mức giá hợp lệ',
                type: 'error',
                duration: 3000
            });
            return;
        }

        setSaving(true);
        try {
            const response = await axios.put(
                `${API_URL}/products/product/${id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                showToast({
                    title: 'Thành công',
                    message: 'Đã lưu toàn bộ thông tin chi tiết sản phẩm!',
                    type: 'success',
                    duration: 3000
                });
            } else {
                showToast({
                    title: 'Lỗi',
                    message: response.data.message || 'Không thể lưu sản phẩm',
                    type: 'error',
                    duration: 3000
                });
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật sản phẩm:', err);
            showToast({
                title: 'Lỗi lưu dữ liệu',
                message: err.response?.data?.message || 'Không thể lưu sản phẩm. Vui lòng thử lại!',
                type: 'error',
                duration: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    // Xóa sản phẩm
    const handleDelete = async () => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${formData.name}"? Hành động này không thể hoàn tác.`)) {
            return;
        }

        try {
            const res = await axios.delete(`${API_URL}/products/product/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            if (res.data.success) {
                showToast({
                    title: 'Đã xóa',
                    message: 'Sản phẩm đã được xóa thành công!',
                    type: 'success',
                    duration: 3000
                });
                navigate('/admin?tab=products', { state: { activeTab: 'products' } });
            }
        } catch (err) {
            showToast({
                title: 'Lỗi xóa sản phẩm',
                message: err.response?.data?.message || 'Không thể xóa sản phẩm',
                type: 'error',
                duration: 3000
            });
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(Number(val) || 0);
    };

    if (loading) {
        return (
            <div className={cx('loading-wrapper')}>
                <div className={cx('spinner')} />
                <p>Đang tải chi tiết sản phẩm...</p>
            </div>
        );
    }

    const primaryImage = formData.images?.[0]?.url || 'https://via.placeholder.com/400';

    return (
        <div className={cx('page-wrapper')}>
            <div className={cx('container')}>
                {/* Top Action & Breadcrumb Bar */}
                <header className={cx('top-bar')}>
                    <div className={cx('breadcrumbs')}>
                        <Link to="/admin?tab=products" state={{ activeTab: 'products' }} className={cx('back-link')}>
                            <i className="fas fa-arrow-left" /> Quay lại Quản lý sản phẩm
                        </Link>
                        <span className={cx('separator')}>/</span>
                        <span className={cx('crumb-active')}>Chỉnh sửa chi tiết</span>
                        {formData.code && (
                            <span className={cx('code-badge')}>{formData.code}</span>
                        )}
                    </div>

                    <div className={cx('actions')}>
                        <a
                            href={`/product/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cx('btn-secondary')}
                            title="Mở xem trang bán hàng khách thấy"
                        >
                            <i className="fas fa-external-link-alt" /> Xem trên Web
                        </a>

                        <button
                            type="button"
                            className={cx('btn-danger')}
                            onClick={handleDelete}
                        >
                            <i className="fas fa-trash" /> Xóa
                        </button>

                        <button
                            type="button"
                            className={cx('btn-primary')}
                            onClick={handleSave}
                            disabled={saving || uploading}
                        >
                            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
                            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </header>

                <div className={cx('layout-grid')}>
                    {/* Cột trái: Các form chi tiết */}
                    <main className={cx('main-column')}>
                        {/* Khối 1: Thông tin cơ bản */}
                        <section className={cx('card')}>
                            <div className={cx('card-header')}>
                                <div className={cx('header-icon')}>
                                    <i className="fas fa-tag" />
                                </div>
                                <div>
                                    <h2 className={cx('card-title')}>Thông tin cơ bản</h2>
                                    <p className={cx('card-subtitle')}>Tên hiển thị, mã định danh và mô tả sản phẩm</p>
                                </div>
                            </div>

                            <div className={cx('card-body')}>
                                <div className={cx('form-group')}>
                                    <label className={cx('label')}>
                                        Tên sản phẩm <span className={cx('required')}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={cx('input')}
                                        value={formData.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        placeholder="Ví dụ: Áo Sơ Mi Nam Prada Double Match Poplin Shirt"
                                    />
                                </div>

                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Mã sản phẩm (SKU / Code)</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            value={formData.code}
                                            onChange={(e) => handleFieldChange('code', e.target.value)}
                                            placeholder="Ví dụ: PD6981 hoặc 1ABYYW"
                                        />
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Thương hiệu</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            value={formData.brand}
                                            onChange={(e) => handleFieldChange('brand', e.target.value)}
                                            placeholder="PRADA, GUCCI, DIOR..."
                                            list="brand-suggestions"
                                        />
                                        <datalist id="brand-suggestions">
                                            {POPULAR_BRANDS.map(b => (
                                                <option key={b} value={b} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                <div className={cx('form-group')}>
                                    <label className={cx('label')}>Mô tả chi tiết sản phẩm</label>
                                    <textarea
                                        rows={6}
                                        className={cx('textarea')}
                                        value={formData.description}
                                        onChange={(e) => handleFieldChange('description', e.target.value)}
                                        placeholder="Nhập thông tin chi tiết về chất liệu, điểm nhấn thiết kế, hướng dẫn bảo quản..."
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Khối 2: Quản lý hình ảnh Cloudflare R2 */}
                        <section className={cx('card')}>
                            <div className={cx('card-header')}>
                                <div className={cx('header-icon', 'icon-gold')}>
                                    <i className="fas fa-cloud-upload-alt" />
                                </div>
                                <div className={cx('header-flex')}>
                                    <div>
                                        <h2 className={cx('card-title')}>Thư viện hình ảnh (Cloudflare R2 CDN)</h2>
                                        <p className={cx('card-subtitle')}>
                                            Ảnh được lưu trữ vĩnh viễn trên Cloudflare R2 với tốc độ tải CDN siêu nhanh
                                        </p>
                                    </div>
                                    <span className={cx('badge-r2')}>
                                        <i className="fas fa-bolt" /> R2 CDN
                                    </span>
                                </div>
                            </div>

                            <div className={cx('card-body')}>
                                {/* Danh sách ảnh hiện có */}
                                <div className={cx('images-grid')}>
                                    {formData.images && formData.images.length > 0 ? (
                                        formData.images.map((img, index) => (
                                            <div key={index} className={cx('image-card', { 'is-primary': index === 0 })}>
                                                <div
                                                    className={cx('img-wrap')}
                                                    onClick={() => {
                                                        setLightboxIndex(index);
                                                        setLightboxOpen(true);
                                                    }}
                                                    title="Ấn để xem ảnh to hơn"
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <img src={img.url} alt={`Ảnh ${index + 1}`} />
                                                    <div className={cx('img-zoom-hint')}>
                                                        <i className="fas fa-search-plus" />
                                                    </div>
                                                    {index === 0 && (
                                                        <span className={cx('primary-badge')}>
                                                            <i className="fas fa-star" /> Ảnh chính
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={cx('image-actions')}>
                                                    {index !== 0 && (
                                                        <button
                                                            type="button"
                                                            className={cx('img-action-btn')}
                                                            onClick={() => handleSetPrimaryImage(index)}
                                                            title="Đặt làm ảnh đại diện"
                                                        >
                                                            <i className="fas fa-star" /> Đặt chính
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={cx('img-action-btn', 'delete')}
                                                        onClick={() => handleRemoveImage(index)}
                                                        title="Xóa ảnh này"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={cx('no-images-box')}>
                                            <i className="far fa-image" />
                                            <p>Chưa có hình ảnh nào cho sản phẩm này.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Khu vực upload thêm ảnh mới */}
                                <div className={cx('upload-zone')}>
                                    <input
                                        type="file"
                                        id="detail-upload-file"
                                        multiple
                                        accept="image/*"
                                        className={cx('file-input')}
                                        onChange={handleUploadImages}
                                        disabled={uploading}
                                    />
                                    <label htmlFor="detail-upload-file" className={cx('upload-label')}>
                                        <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-plus-circle'}`} />
                                        <span>
                                            {uploading ? 'Đang tải ảnh lên Cloudflare R2...' : 'Bấm để thêm ảnh mới tải lên Cloudflare R2'}
                                        </span>
                                        <small>Hỗ trợ định dạng PNG, JPG, WEBP. Tự động chuyển đổi lưu trữ CDN.</small>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* Khối 3: Giá & Kho hàng */}
                        <section className={cx('card')}>
                            <div className={cx('card-header')}>
                                <div className={cx('header-icon')}>
                                    <i className="fas fa-coins" />
                                </div>
                                <div>
                                    <h2 className={cx('card-title')}>Giá & Tồn kho</h2>
                                    <p className={cx('card-subtitle')}>Định mức giá và số lượng khả dụng trong kho hàng</p>
                                </div>
                            </div>

                            <div className={cx('card-body')}>
                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>
                                            Giá bán (VNĐ) <span className={cx('required')}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            className={cx('input')}
                                            value={formData.price}
                                            onChange={(e) => handleFieldChange('price', Number(e.target.value))}
                                            placeholder="Nhập giá bán"
                                        />
                                        <small className={cx('hint-text')}>
                                            Định dạng: {formatCurrency(formData.price)}
                                        </small>
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>
                                            Số lượng trong kho <span className={cx('required')}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            className={cx('input')}
                                            value={formData.stock}
                                            onChange={(e) => handleFieldChange('stock', Number(e.target.value))}
                                            placeholder="Nhập số lượng"
                                            min={0}
                                        />
                                        <small className={cx('hint-text')}>
                                            {formData.stock > 0 ? (
                                                <span className={cx('stock-active')}>Còn hàng ({formData.stock} chiếc)</span>
                                            ) : (
                                                <span className={cx('stock-out')}>Hết hàng</span>
                                            )}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Khối 4: Thuộc tính & Chi tiết sản phẩm */}
                        <section className={cx('card')}>
                            <div className={cx('card-header')}>
                                <div className={cx('header-icon')}>
                                    <i className="fas fa-sliders-h" />
                                </div>
                                <div>
                                    <h2 className={cx('card-title')}>Phân loại & Thuộc tính</h2>
                                    <p className={cx('card-subtitle')}>Thuộc tính chi tiết phục vụ lọc và tìm kiếm</p>
                                </div>
                            </div>

                            <div className={cx('card-body')}>
                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Loại sản phẩm</label>
                                        <select
                                            className={cx('select')}
                                            value={formData.category}
                                            onChange={(e) => handleFieldChange('category', e.target.value)}
                                        >
                                            <option value="">-- Chọn phân loại --</option>
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Giới tính</label>
                                        <select
                                            className={cx('select')}
                                            value={formData.gioiTinh}
                                            onChange={(e) => handleFieldChange('gioiTinh', e.target.value)}
                                        >
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Unisex">Unisex</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Kích cỡ (Size)</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            value={formData.size}
                                            onChange={(e) => handleFieldChange('size', e.target.value)}
                                            placeholder="S, M, L, XL hoặc Free size"
                                        />
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Màu sắc</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            value={formData.mauSac}
                                            onChange={(e) => handleFieldChange('mauSac', e.target.value)}
                                            placeholder="Ví dụ: Đen, Vàng họa tiết, Xanh Navy"
                                        />
                                    </div>
                                </div>

                                <div className={cx('form-row')}>
                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Chất liệu</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            value={formData.chatLieu}
                                            onChange={(e) => handleFieldChange('chatLieu', e.target.value)}
                                            placeholder="Ví dụ: Cotton Poplin, Lụa, Denim..."
                                        />
                                    </div>

                                    <div className={cx('form-group')}>
                                        <label className={cx('label')}>Kiểu dáng</label>
                                        <input
                                            type="text"
                                            className={cx('input')}
                                            value={formData.kieuDang}
                                            onChange={(e) => handleFieldChange('kieuDang', e.target.value)}
                                            placeholder="Ví dụ: Áo sơ mi ngắn tay, Regular fit..."
                                        />
                                    </div>
                                </div>

                                <div className={cx('form-group')}>
                                    <label className={cx('label')}>Xuất xứ</label>
                                    <input
                                        type="text"
                                        className={cx('input')}
                                        value={formData.xuatXu}
                                        onChange={(e) => handleFieldChange('xuatXu', e.target.value)}
                                        placeholder="Ví dụ: Ý, Pháp, Việt Nam..."
                                    />
                                </div>
                            </div>
                        </section>
                    </main>

                    {/* Cột phải: Xem trước thẻ & Thao tác nhanh */}
                    <aside className={cx('side-column')}>
                        {/* Thẻ xem trước trực quan */}
                        <div className={cx('preview-card')}>
                            <div className={cx('preview-header')}>
                                <span className={cx('preview-tag')}>
                                    <i className="fas fa-eye" /> Thẻ xem trước
                                </span>
                                <span className={cx('preview-brand')}>{formData.brand || 'BRAND'}</span>
                            </div>

                            <div
                                className={cx('preview-image-box')}
                                onClick={() => {
                                    setLightboxIndex(0);
                                    setLightboxOpen(true);
                                }}
                                title="Ấn để xem ảnh to hơn"
                                role="button"
                                tabIndex={0}
                            >
                                <img src={primaryImage} alt={formData.name} />
                                <div className={cx('preview-img-zoom-hint')}>
                                    <i className="fas fa-search-plus" />
                                </div>
                            </div>

                            <div className={cx('preview-info')}>
                                <h4 className={cx('preview-name')}>
                                    {formData.name || 'Tên sản phẩm chưa nhập'}
                                </h4>
                                <div className={cx('preview-price')}>
                                    {formatCurrency(formData.price)}
                                </div>

                                <div className={cx('preview-chips')}>
                                    {formData.gioiTinh && <span>{formData.gioiTinh}</span>}
                                    {formData.size && <span>Size {formData.size}</span>}
                                    {formData.mauSac && <span>{formData.mauSac}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Thẻ thao tác lưu trữ sticky */}
                        <div className={cx('sticky-actions-card')}>
                            <h3 className={cx('actions-title')}>Thao tác xuất bản</h3>
                            <p className={cx('actions-desc')}>
                                Các cập nhật sẽ được đồng bộ ngay lập tức tới cơ sở dữ liệu và trang bán lẻ.
                            </p>

                            <button
                                type="button"
                                className={cx('save-btn-large')}
                                onClick={handleSave}
                                disabled={saving || uploading}
                            >
                                <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-check-circle'}`} />
                                {saving ? 'Đang lưu cập nhật...' : 'Cập nhật sản phẩm'}
                            </button>

                            <button
                                type="button"
                                className={cx('cancel-btn-large')}
                                onClick={() => navigate('/admin?tab=products', { state: { activeTab: 'products' } })}
                            >
                                Quay lại Quản lý sản phẩm
                            </button>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Modal phóng to ảnh Lightbox */}
            <ImageLightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                images={formData.images || []}
                initialIndex={lightboxIndex}
                title={formData.name}
                subtitle={formData.brand ? `${formData.brand}${formData.code ? ' • ' + formData.code : ''}` : formData.code}
            />
        </div>
    );
}

export default AdminProductDetail;
