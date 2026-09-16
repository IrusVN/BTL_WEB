import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import * as styles from './Product.module.scss';
import { getProducts, getProductsByCategory } from '../../services/productService.js';
import { showToast } from '../../components/Toast/index.js';
import ProductItem from '../../components/ProductItem/index.js';
import { useHead } from '../../hooks/useHead.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

const Product = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('category');
    const brandParam = searchParams.get('brand');
    const genderParam = searchParams.get('gender');
    const searchParam = searchParams.get('search');
    const navigate = useNavigate();
    const location = useLocation();

    const headTitle = searchParam
        ? `Tìm kiếm "${searchParam}"`
        : brandParam
            ? `Thương hiệu ${brandParam}`
            : genderParam
                ? `Thời trang ${genderParam === 'male' || genderParam === 'Nam' ? 'Nam' : 'Nữ'}`
                : 'Tất cả sản phẩm';
    useHead(headTitle);
    
    const [showFiltersMobile, setShowFiltersMobile] = useState(false);
    
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000000 });
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedGender, setSelectedGender] = useState('');
    const [sortOption, setSortOption] = useState('default');
    
    const [brands, setBrands] = useState([]);
    const genders = ['Nam', 'Nữ', 'Unisex'];

    const [searchTerm, setSearchTerm] = useState('');

    const filterButtonRef = useRef(null);
    const filterBoxRef = useRef(null);
    
    const [expandedSections, setExpandedSections] = useState({
        price: true,
        brand: true,
        gender: true,
        sort: true
    });
    
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    
    const toggleFiltersMobile = () => {
        setShowFiltersMobile(prev => !prev);
    };
    
    useEffect(() => {
        if (!document.getElementById("fixed-filter-button")) {
            const button = document.createElement('button');
            button.id = "fixed-filter-button";
            button.className = cx('filter-toggle-mobile');
            
            button.innerHTML = `
                <i class="fas ${showFiltersMobile ? 'fa-times' : 'fa-filter'}"></i>
                <span class="${cx('filter-label')}">Bộ lọc</span>
            `;
            
            button.addEventListener('click', toggleFiltersMobile);
            
            document.body.appendChild(button);
            
            filterButtonRef.current = button;
        }
        
        if (filterButtonRef.current) {
            const iconElement = filterButtonRef.current.querySelector('i');
            if (iconElement) {
                iconElement.className = `fas ${showFiltersMobile ? 'fa-times' : 'fa-filter'}`;
            }
        }
        
        return () => {
            const filterButton = document.getElementById("fixed-filter-button");
            if (filterButton) {
                filterButton.remove();
            }
        };
    }, [showFiltersMobile]);
    
    useEffect(() => {
        if (showFiltersMobile) {
            if (!document.getElementById("floating-filter-box")) {
                const filterBox = document.createElement('div');
                filterBox.id = "floating-filter-box";
                filterBox.className = cx('floating-filter-box');
                
                filterBox.innerHTML = `
                    <div class="${cx('filter-box-header')}">
                        <h3>Bộ lọc sản phẩm</h3>
                        <button class="${cx('close-filter-btn')}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="${cx('filter-box-content')}">
                        <!-- Khoảng giá -->
                        <div class="${cx('filter-section')}">
                            <div class="${cx('filter-section-header')}" data-section="price">
                                <h4>Khoảng giá</h4>
                                <i class="fas fa-chevron-down ${expandedSections.price ? cx('rotate') : ''}"></i>
                            </div>
                            <div class="${cx('filter-section-content', {'collapsed': !expandedSections.price})}">
                                <div class="${cx('price-inputs')}">
                                    <div class="${cx('price-input')}">
                                        <label>Từ:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value="${priceRange.min}"
                                            id="price-min"
                                        />
                                    </div>
                                    <div class="${cx('price-input')}">
                                        <label>Đến:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value="${priceRange.max}"
                                            id="price-max"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Thương hiệu -->
                        <div class="${cx('filter-section')}">
                            <div class="${cx('filter-section-header')}" data-section="brand">
                                <h4>Thương hiệu</h4>
                                <i class="fas fa-chevron-down ${expandedSections.brand ? cx('rotate') : ''}"></i>
                            </div>
                            <div class="${cx('filter-section-content', {'collapsed': !expandedSections.brand})}">
                                <div class="${cx('brand-list')}">
                                    ${brands.map((brand, index) => `
                                        <div class="${cx('brand-item')}">
                                            <input
                                                type="checkbox"
                                                id="brand-${index}"
                                                ${selectedBrands.some(selected => 
                                                    selected.toLowerCase() === brand.toLowerCase()
                                                ) ? 'checked' : ''}
                                                data-brand="${brand}"
                                            />
                                            <label for="brand-${index}">${brand}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Giới tính -->
                        <div class="${cx('filter-section')}">
                            <div class="${cx('filter-section-header')}" data-section="gender">
                                <h4>Giới tính</h4>
                                <i class="fas fa-chevron-down ${expandedSections.gender ? cx('rotate') : ''}"></i>
                            </div>
                            <div class="${cx('filter-section-content', {'collapsed': !expandedSections.gender})}">
                                <div class="${cx('gender-list')}">
                                    ${genders.map((gender, index) => `
                                        <div class="${cx('gender-item')}">
                                            <input
                                                type="radio"
                                                id="gender-${index}"
                                                name="gender"
                                                ${selectedGender === gender ? 'checked' : ''}
                                                data-gender="${gender}"
                                            />
                                            <label for="gender-${index}">${gender}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Sắp xếp -->
                        <div class="${cx('filter-section')}">
                            <div class="${cx('filter-section-header')}" data-section="sort">
                                <h4>Sắp xếp</h4>
                                <i class="fas fa-chevron-down ${expandedSections.sort ? cx('rotate') : ''}"></i>
                            </div>
                            <div class="${cx('filter-section-content', {'collapsed': !expandedSections.sort})}">
                                <select class="${cx('sort-select')}" id="sort-select">
                                    <option value="default" ${sortOption === 'default' ? 'selected' : ''}>Mặc định</option>
                                    <option value="price-asc" ${sortOption === 'price-asc' ? 'selected' : ''}>Giá: Thấp đến cao</option>
                                    <option value="price-desc" ${sortOption === 'price-desc' ? 'selected' : ''}>Giá: Cao đến thấp</option>
                                    <option value="name-asc" ${sortOption === 'name-asc' ? 'selected' : ''}>Tên: A-Z</option>
                                    <option value="name-desc" ${sortOption === 'name-desc' ? 'selected' : ''}>Tên: Z-A</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="${cx('filter-box-footer')}">
                        <button class="${cx('clear-filter')}" id="clear-filter-btn">
                            Xóa bộ lọc
                        </button>
                        <button class="${cx('apply-filter')}" id="apply-filter-btn">
                            Áp dụng & Đóng
                        </button>
                    </div>
                `;
                
                document.body.appendChild(filterBox);
                
                filterBoxRef.current = filterBox;
                
                const closeBtn = filterBox.querySelector(`.${cx('close-filter-btn')}`);
                if (closeBtn) {
                    closeBtn.addEventListener('click', toggleFiltersMobile);
                }
                
                const applyBtn = filterBox.querySelector('#apply-filter-btn');
                if (applyBtn) {
                    applyBtn.addEventListener('click', () => {
                        const minInput = document.getElementById('price-min');
                        const maxInput = document.getElementById('price-max');
                        if (minInput && maxInput) {
                            setPriceRange({
                                min: parseInt(minInput.value) || 0,
                                max: parseInt(maxInput.value) || 100000000
                            });
                        }
                        
                        const checkedBrands = Array.from(document.querySelectorAll('input[data-brand]:checked'))
                            .map(input => input.getAttribute('data-brand'));
                        setSelectedBrands(checkedBrands);
                        
                        const checkedGender = document.querySelector('input[data-gender]:checked');
                        if (checkedGender) {
                            setSelectedGender(checkedGender.getAttribute('data-gender'));
                        } else {
                            setSelectedGender('');
                        }
                        
                        const sortSelect = document.getElementById('sort-select');
                        if (sortSelect) {
                            setSortOption(sortSelect.value);
                        }
                        
                        updateUrlParams(
                            checkedBrands.length > 0 ? checkedBrands[0] : null,
                            checkedGender ? checkedGender.getAttribute('data-gender') : ''
                        );
                        
                        toggleFiltersMobile();
                    });
                }
                
                const clearBtn = filterBox.querySelector('#clear-filter-btn');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        const minInput = document.getElementById('price-min');
                        const maxInput = document.getElementById('price-max');
                        if (minInput && maxInput) {
                            minInput.value = 0;
                            maxInput.value = 100000000;
                        }
                        
                        document.querySelectorAll('input[data-brand]:checked').forEach(input => {
                            input.checked = false;
                        });
                        
                        document.querySelectorAll('input[data-gender]:checked').forEach(input => {
                            input.checked = false;
                        });
                        
                        const sortSelect = document.getElementById('sort-select');
                        if (sortSelect) {
                            sortSelect.value = 'default';
                        }
                        
                        clearFilters();
                    });
                }
                
                const sectionHeaders = filterBox.querySelectorAll(`.${cx('filter-section-header')}`);
                sectionHeaders.forEach(header => {
                    header.addEventListener('click', () => {
                        const section = header.getAttribute('data-section');
                        if (section) {
                            toggleSection(section);
                            const icon = header.querySelector('i');
                            if (icon) {
                                icon.classList.toggle(cx('rotate'));
                            }
                            const content = header.nextElementSibling;
                            if (content) {
                                content.classList.toggle(cx('collapsed'));
                            }
                        }
                    });
                });
                
                let isDragging = false;
                let offsetX, offsetY;
                
                const filterHeader = filterBox.querySelector(`.${cx('filter-box-header')}`);
                if (filterHeader) {
                    filterHeader.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        offsetX = e.clientX - filterBox.getBoundingClientRect().left;
                        offsetY = e.clientY - filterBox.getBoundingClientRect().top;
                        filterBox.style.cursor = 'grabbing';
                    });
                    
                    document.addEventListener('mousemove', (e) => {
                        if (isDragging) {
                            const x = e.clientX - offsetX;
                            const y = e.clientY - offsetY;
                            
                            const maxX = window.innerWidth - filterBox.offsetWidth;
                            const maxY = window.innerHeight - filterBox.offsetHeight;
                            
                            filterBox.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                            filterBox.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
                        }
                    });
                    
                    document.addEventListener('mouseup', () => {
                        isDragging = false;
                        if (filterBox) {
                            filterBox.style.cursor = 'auto';
                        }
                    });
                    
                    filterHeader.addEventListener('touchstart', (e) => {
                        isDragging = true;
                        offsetX = e.touches[0].clientX - filterBox.getBoundingClientRect().left;
                        offsetY = e.touches[0].clientY - filterBox.getBoundingClientRect().top;
                    });
                    
                    document.addEventListener('touchmove', (e) => {
                        if (isDragging) {
                            const x = e.touches[0].clientX - offsetX;
                            const y = e.touches[0].clientY - offsetY;
                            
                            const maxX = window.innerWidth - filterBox.offsetWidth;
                            const maxY = window.innerHeight - filterBox.offsetHeight;
                            
                            filterBox.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                            filterBox.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
                        }
                    });
                    
                    document.addEventListener('touchend', () => {
                        isDragging = false;
                    });
                }
            }
        } else {
            const filterBox = document.getElementById("floating-filter-box");
            if (filterBox) {
                filterBox.remove();
                filterBoxRef.current = null;
            }
        }
    }, [showFiltersMobile, expandedSections, brands, genders, selectedBrands, selectedGender, sortOption, priceRange]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await getProducts();
                
                if (response.success) {
                    const productsData = response.products || [];
                    setProducts(productsData);
                    
                    const brandList = [...new Set(productsData.map(product => 
                        product.brand ? product.brand.trim() : null
                    ).filter(brand => brand))];
                    
                    setBrands(brandList);
                    
                    if (brandParam && !selectedBrands.length) {
                        const matchingBrand = brandList.find(brand => 
                            brand.toLowerCase() === brandParam.toLowerCase()
                        );
                        
                        if (matchingBrand) {
                            setSelectedBrands([matchingBrand]);
                        } else {
                            setSelectedBrands([brandParam]);
                        }
                    }
                    
                    showToast({
                        title: "Thành công",
                        message: "Đã tải sản phẩm thành công!",
                        type: "success",
                        duration: 2000
                    });
                } else {
                    setError('Không thể tải danh sách sản phẩm');
                }
                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm:', error);
                setError('Đã xảy ra lỗi khi tải danh sách sản phẩm');
                setLoading(false);
                showToast({
                    title: "Lỗi",
                    message: "Không thể tải sản phẩm. Vui lòng thử lại sau!",
                    type: "error",
                    duration: 3000
                });
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        console.log("URL params đã thay đổi:");
        console.log("Brand param:", brandParam);
        console.log("Gender param:", genderParam);
        
        if (brandParam) {
            const matchingBrand = brands.find(brand => 
                brand.toLowerCase() === brandParam.toLowerCase()
            );
            
            if (matchingBrand) {
                console.log(`Tìm thấy thương hiệu chính xác: ${matchingBrand}`);
                setSelectedBrands([matchingBrand]);
            } else {
                console.log(`Không tìm thấy thương hiệu chính xác cho: ${brandParam}`);
                setSelectedBrands([brandParam]);
            }
        } else {
            setSelectedBrands([]);
        }
        
        if (genderParam) {
            console.log(`Đặt giới tính đã chọn: ${genderParam}`);
            setSelectedGender(genderParam);
        } else {
            setSelectedGender('');
        }
    }, [brandParam, genderParam, brands]);
    
    useEffect(() => {
        if (searchParam) {
            setSearchTerm(searchParam);
        } else {
            setSearchTerm('');
        }
    }, [searchParam]);
    
    useEffect(() => {
        if (products.length === 0) return;
        
        let result = [...products];
        
        if (searchTerm) {
            const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 0);
            
            result = result.map(product => {
                const productName = product.name ? product.name.toLowerCase() : '';
                const productDesc = product.description ? product.description.toLowerCase() : '';
                
                let relevanceScore = 0;
                
                searchWords.forEach(word => {
                    if (productName.includes(word)) {
                        relevanceScore += 2;
                    } 
                    else if (productDesc.includes(word)) {
                        relevanceScore += 1;
                    }
                });
                
                return {
                    ...product,
                    relevanceScore
                };
            });
            
            result = result
                .filter(product => product.relevanceScore > 0)
                .sort((a, b) => b.relevanceScore - a.relevanceScore);
        }
        
        result = result.filter(product => 
            product.price >= priceRange.min && product.price <= priceRange.max
        );
        
        if (selectedBrands.length > 0) {
            result = result.filter(product => {
                if (!product.brand) return false;
                return selectedBrands.some(brand => 
                    product.brand.toLowerCase() === brand.toLowerCase()
                );
            });
        }
        
        if (selectedGender) {
            result = result.filter(product => {
                if (!product.gioiTinh) return false;
                return product.gioiTinh.toLowerCase() === selectedGender.toLowerCase();
            });
        }
        
        switch(sortOption) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                break;
        }
        
        setFilteredProducts(result);
    }, [products, priceRange, selectedBrands, selectedGender, sortOption, searchTerm]);

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };
    
    const handleBrandChange = (brand) => {
        let newBrands = [...selectedBrands];
        
        const isSelected = selectedBrands.some(selected => 
            selected.toLowerCase() === brand.toLowerCase()
        );
        
        if (isSelected) {
            newBrands = newBrands.filter(selected => 
                selected.toLowerCase() !== brand.toLowerCase()
            );
        } else {
            newBrands.push(brand);
        }
        
        setSelectedBrands(newBrands);
        
        updateUrlParams(newBrands.length > 0 ? newBrands[0] : null, selectedGender);
    };
    
    const handleGenderChange = (gender) => {
        const newGender = selectedGender === gender ? '' : gender;
        setSelectedGender(newGender);
        
        updateUrlParams(selectedBrands.length > 0 ? selectedBrands[0] : null, newGender);
    };
    
    const updateUrlParams = (brand, gender) => {
        const params = new URLSearchParams();
        
        if (brand) {
            params.set('brand', brand);
        }
        
        if (gender) {
            params.set('gender', gender);
        }
        
        if (categoryId) {
            params.set('category', categoryId);
        }
        
        if (searchTerm) {
            params.set('search', searchTerm);
        }
        
        const newUrl = `/products${params.toString() ? `?${params.toString()}` : ''}`;
        navigate(newUrl, { replace: true });
    };
    
    const handlePriceChange = (e, type) => {
        const value = parseInt(e.target.value);
        setPriceRange(prev => ({
            ...prev,
            [type]: value
        }));
    };
    
    const handleSortChange = (e) => {
        setSortOption(e.target.value);
    };
    
    const clearFilters = () => {
        setPriceRange({ min: 0, max: 100000000 });
        setSelectedBrands([]);
        setSelectedGender('');
        setSortOption('default');
        setSearchTerm('');
        navigate('/products', { replace: true });
    };

    const getPageTitle = () => {
        if (searchTerm) {
            return `Kết quả tìm kiếm cho "${searchTerm}"`;
        } else if (selectedGender && selectedGender === 'Nam') {
            return 'Sản phẩm dành cho Nam';
        } else if (selectedGender && selectedGender === 'Nữ') {
            return 'Sản phẩm dành cho Nữ';
        } else if (selectedBrands.length === 1) {
            return `Sản phẩm thương hiệu ${selectedBrands[0]}`;
        } else if (categoryId) {
            return 'Sản phẩm theo danh mục';
        } else {
            return 'Tất cả sản phẩm';
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <h2 className={cx('section-title')}>
                    {getPageTitle()}
                </h2>
                
                <div className={cx('content-wrapper')}>
                    {/* Phần hiển thị sản phẩm */}
                    <div className={cx('products-container')}>
                        {loading ? (
                            <div className={cx('products-grid')}>
                                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <div key={i} className={cx('skeleton-card')}>
                                        <div className={cx('skeleton-image')}></div>
                                        <div className={cx('skeleton-line')}></div>
                                        <div className={cx('skeleton-line', 'skeleton-line-short')}></div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className={cx('error')}>{error}</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className={cx('no-products')}>Không có sản phẩm nào phù hợp với bộ lọc</div>
                        ) : (
                            <>
                                <div className={cx('products-count')}>
                                    Hiển thị {filteredProducts.length} sản phẩm
                                </div>
                                <div className={cx('products-grid')}>
                                    {filteredProducts.map(product => (
                                        <ProductItem key={product._id} product={product} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Product;
