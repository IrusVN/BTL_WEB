import classNames from 'classnames/bind';
import * as styles from './Header.module.scss';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo_rmbg from '../../../../img/logo-rmbg.png';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useAuth } from '../../../../context/AuthContext.js';
import BadgeCart from '../../../BadgeCart/index.js';
import ThemeToggle from '../../../ThemeToggle/index.js';
import { showToast } from '../../../Toast/index.js';
import { useProductSuggestions } from '../../../../hooks/useProductSuggestions.js';

const cx = classNames.bind(styles);

const SEARCH_SUGGESTIONS = ['Nike', 'Gucci', 'Dior', 'Balenciaga', 'Adidas'];

const formatSuggestionPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { suggestions } = useProductSuggestions(showSearch || showMobileSearch ? searchTerm : '');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [activeMobileDropdown, setActiveMobileDropdown] = useState(null);
    
    const mobileMenuRef = useRef(null);
    const mobileSearchRef = useRef(null);
    const hamburgerIconRef = useRef(null);
    
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);
    
    const toggleMobileMenu = useCallback(() => {
        setShowMobileMenu(prevState => {
            return !prevState;
        });
    }, []);
    
    const handleLogout = useCallback(() => {
        logout();
        setShowMobileMenu(false);
        
        const isMobileDevice = window.innerWidth <= 768;
        if (isMobileDevice) {
            showToast({
                title: "Đăng xuất thành công",
                message: "Hẹn gặp lại bạn!",
                type: "success",
                duration: 2000
            });
        }
    }, [logout]);
    
    const navigateToBrand = useCallback((brand) => {
        navigate(`/products?brand=${encodeURIComponent(brand)}`);
        setShowMobileMenu(false);
    }, [navigate]);
    
    const navigateToGender = useCallback((gender) => {
        navigate(`/products?gender=${encodeURIComponent(gender)}`);
        setShowMobileMenu(false);
    }, [navigate]);
    
    const toggleSearch = useCallback(() => {
        setShowSearch(prevState => !prevState);
        if (showSearch) {
            setSearchTerm('');
        }
    }, [showSearch]);
    
    const toggleMobileSearch = useCallback(() => {
        setShowMobileSearch(prevState => {
            const isMobileDevice = window.innerWidth <= 768;
            if (isMobileDevice && !prevState) {
                showToast({
                    title: "Tìm kiếm",
                    message: "Nhập từ khóa để tìm sản phẩm",
                    type: "info",
                    duration: 1500
                });
            }
            return !prevState;
        });
        if (showMobileSearch) {
            setSearchTerm('');
        }
    }, [showMobileSearch]);
    
    const handleSearchSubmit = useCallback((e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
            setShowSearch(false);
            setShowMobileSearch(false);
            
            const isMobileDevice = window.innerWidth <= 768;
            if (isMobileDevice && searchTerm.trim().length > 3) {
                showToast({
                    title: "Đang tìm kiếm",
                    message: `"${searchTerm.trim()}" - Đang hiển thị kết quả`,
                    type: "info",
                    duration: 1500
                });
            }
        }
    }, [navigate, searchTerm]);
    
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(e);
        }
    }, [handleSearchSubmit]);

    const handleSuggestion = useCallback((term) => {
        setSearchTerm(term);
        navigate(`/products?search=${encodeURIComponent(term)}`);
        setShowSearch(false);
        setShowMobileSearch(false);
    }, [navigate]);

    const handleProductSuggestion = useCallback((product) => {
        navigate(`/product/${product._id}`);
        setShowSearch(false);
        setShowMobileSearch(false);
    }, [navigate]);
    
    const closeMobileMenu = useCallback(() => {
        setShowMobileMenu(false);
        setActiveMobileDropdown(null);
        
    }, []);

    const toggleMobileDropdown = useCallback((dropdownName) => {
        setActiveMobileDropdown(prevDropdown => 
            prevDropdown === dropdownName ? null : dropdownName
        );
    }, []);
    
    useEffect(() => {
        if (showMobileMenu) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'visible';
        }

        return () => {
            document.body.style.overflow = 'visible';
        };
    }, [showMobileMenu]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 992 && showMobileMenu) {
                setShowMobileMenu(false);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [showMobileMenu]);
    
    useEffect(() => {
        const handleHamburgerClick = (e) => {
            e.stopPropagation();
            toggleMobileMenu();
        };
        
        const hamburgerElement = hamburgerIconRef.current;
        if (hamburgerElement) {
            hamburgerElement.addEventListener('click', handleHamburgerClick);
        }
        
        return () => {
            if (hamburgerElement) {
                hamburgerElement.removeEventListener('click', handleHamburgerClick);
            }
        };
    }, [toggleMobileMenu]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (hamburgerIconRef.current && hamburgerIconRef.current.contains(event.target)) {
                return;
            }
            
            const searchBox = document.getElementById('search-box');
            const searchIcon = document.getElementById('search-icon');
            
            if (showSearch && searchBox && !searchBox.contains(event.target) && !searchIcon.contains(event.target)) {
                setShowSearch(false);
                setSearchTerm('');
            }
            
            if (mobileSearchRef.current && showMobileSearch && !mobileSearchRef.current.contains(event.target)) {
                setShowMobileSearch(false);
                setSearchTerm('');
            }
            
            if (showMobileMenu && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setShowMobileMenu(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearch, showMobileMenu, showMobileSearch]);
    
    const handleMobileLogin = useCallback(() => {
        closeMobileMenu();
    }, [closeMobileMenu]);

    const handleMobileRegister = useCallback(() => {
        closeMobileMenu();
    }, [closeMobileMenu]);
    
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            if (scrollPosition > 50) {
                setIsHeaderSticky(true);
            } else {
                setIsHeaderSticky(false);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        
        handleScroll();
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    
    return (
        <header className={cx('header', { 'sticky': isHeaderSticky })}>
            <div className={cx('wrapper', { 'sticky': isHeaderSticky })}>
                <div className={cx('nav')}>
                    {/* Menu desktop */}
                    <div className={cx('nav-left', 'desktop-only')}>
                        <ul className={cx('main-menu')}>
                            <li className={cx('nav-item')}>
                                <Link to="/products" className={cx('nav-link')}>Sản phẩm</Link>
                            </li>
                            <li className={cx('nav-item', 'dropdown')}>
                                <span className={cx('nav-link', 'dropdown-toggle')}>Thương hiệu</span>
                                <div className={cx('dropdown-menu')}>
                                    <a className={cx('dropdown-item')} onClick={() => navigateToBrand('Gucci')}>Gucci</a>
                                    <a className={cx('dropdown-item')} onClick={() => navigateToBrand('Louis Vuitton')}>Louis Vuitton</a>
                                    <a className={cx('dropdown-item')} onClick={() => navigateToBrand('Prada')}>Prada</a>
                                    <a className={cx('dropdown-item')} onClick={() => navigateToBrand('Dior')}>Dior</a>
                                    <a className={cx('dropdown-item')} onClick={() => navigateToBrand('Balenciaga')}>Balenciaga</a>
                                    <a className={cx('dropdown-item')} onClick={() => navigateToBrand('Nike')}>Nike</a>
                                    <a className={cx('dropdown-item')} onClick={() => navigateToBrand('Adidas')}>Adidas</a>
                                </div>
                            </li>
                            <li className={cx('nav-item')}>
                                <a onClick={() => navigateToGender('Nam')} className={cx('nav-link')}>Đồ nam</a>
                            </li>
                            <li className={cx('nav-item')}>
                                <a onClick={() => navigateToGender('Nữ')} className={cx('nav-link')}>Đồ nữ</a>
                            </li>
                        </ul>
                    </div>

                    {/* Mobile controls - Left */}
                    <div className={cx('mobile-nav-left', 'mobile-only')}>
                        <div className={cx('mobile-search-icon')} onClick={toggleMobileSearch}>
                            <i className="fas fa-search"></i>
                        </div>
                    </div>

                    {/* Logo (center for both desktop and mobile) */}
                    <div className={cx('logo')}>
                        <Link to="/"><img src={logo_rmbg} alt="Logo" className={cx('logo_rmbg')} /></Link>
                    </div>

                    {/* Menu desktop */}
                    <div className={cx('nav-right', 'desktop-only')}>
                        <ul className={cx('main-menu')}>
                            {/* Icon tìm kiếm */}
                            <li className={cx('nav-item')}>
                                <div className={cx('search-container')}>
                                    <span className={cx('nav-link')}>
                                        <i 
                                            id="search-icon"
                                            className="fas fa-search" 
                                            onClick={toggleSearch}
                                        ></i>
                                    </span>
                                    {showSearch && (
                                        <div id="search-box" className={cx('search-box')}>
                                            <form onSubmit={handleSearchSubmit}>
                                                <i className={cx('search-icon-leading', 'fas', 'fa-search')}></i>
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm sản phẩm..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyDown={handleKeyPress}
                                                    autoFocus
                                                />
                                                <button type="submit" className={cx('search-submit')} aria-label="Tìm kiếm">
                                                    <i className="fas fa-arrow-right"></i>
                                                </button>
                                            </form>
                                            <div className={cx('search-suggestions')}>
                                                {SEARCH_SUGGESTIONS.map((term) => (
                                                    <button
                                                        key={term}
                                                        type="button"
                                                        className={cx('search-chip')}
                                                        onClick={() => handleSuggestion(term)}
                                                    >
                                                        {term}
                                                    </button>
                                                ))}
                                            </div>
                                            {suggestions.length > 0 && (
                                                <div className={cx('search-product-list')}>
                                                    <p className={cx('search-product-heading')}>Sản phẩm</p>
                                                    {suggestions.map((product) => (
                                                        <button
                                                            key={product._id}
                                                            type="button"
                                                            className={cx('search-product-item')}
                                                            onClick={() => handleProductSuggestion(product)}
                                                        >
                                                            <span className={cx('search-product-thumb')}>
                                                                {product.thumb ? (
                                                                    <img src={product.thumb} alt={product.name} />
                                                                ) : (
                                                                    <i className="fas fa-box-open"></i>
                                                                )}
                                                            </span>
                                                            <span className={cx('search-product-info')}>
                                                                <span className={cx('search-product-name')}>{product.name}</span>
                                                                <span className={cx('search-product-price')}>
                                                                    {formatSuggestionPrice(product.price)}
                                                                </span>
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </li>
                            
                            <li className={cx('nav-item')}>
                                <Link to="/info" className={cx('nav-link')}>Liên hệ</Link>
                            </li>

                            <li className={cx('nav-item')}>
                                <ThemeToggle />
                            </li>

                            {!user ? (
                                <li className={cx('nav-item')}>
                                    <div className={cx('auth-buttons')}>
                                        <Link to="/login" className={cx('btn-dtl', 'btn-primary')}>
                                            <i className="fas fa-sign-in-alt" style={{ marginRight: '5px' }}></i>
                                            <span className={cx('btn-text')}>Đăng nhập</span>
                                        </Link>
                                        <Link to="/login?action=register" className={cx('btn-dtl', 'btn-outline')}>
                                            <i className="fas fa-user-plus" style={{ marginRight: '5px' }}></i>
                                            <span>Đăng ký</span>
                                        </Link>
                                    </div>
                                </li>
                            ) : (
                                <li className={cx('nav-item', 'dropdown')}>
                                    <span className={cx('nav-link', 'dropdown-toggle')}>
                                        <i className="fas fa-user-circle" style={{ marginRight: '5px' }}></i>
                                        {user.email}
                                    </span>
                                    <div className={cx('dropdown-menu')}>
                                        <Link className={cx('dropdown-item')} to="/profile">
                                            <i className="fas fa-id-card-alt" style={{ marginRight: '5px' }}></i>
                                            Thông tin tài khoản
                                        </Link>
                                        <Link className={cx('dropdown-item')} to="/my-orders">
                                            <i className="fas fa-shopping-bag" style={{ marginRight: '5px' }}></i>
                                            Các đơn của tôi
                                        </Link>
                                        <Link className={cx('dropdown-item')} to="/change-password">
                                            <i className="fas fa-key" style={{ marginRight: '5px' }}></i>
                                            Đổi mật khẩu
                                        </Link>
                                        <Link className={cx('dropdown-item')} to="/settings">
                                            <i className="fas fa-cog" style={{ marginRight: '5px' }}></i>
                                            Thiết lập
                                        </Link>
                                        <button className={cx('dropdown-item')} onClick={handleLogout}>
                                            <i className="fas fa-sign-out-alt" style={{ marginRight: '5px' }}></i>
                                            Đăng xuất
                                        </button>
                                    </div>
                                </li>
                            )}

                            <li className={cx('nav-item', 'cart-container')}>
                                <BadgeCart />
                            </li>
                        </ul>
                    </div>

                    {/* Mobile controls - Right — ThemeToggle TRƯỚC cart
                        (user yêu cầu: icon theme nằm bên trái icon cart) */}
                    <div className={cx('mobile-nav-right', 'mobile-only')}>
                        <ThemeToggle />
                        <div className={cx('mobile-cart')}>
                            <BadgeCart />
                        </div>
                        <button
                            type="button"
                            className={cx('hamburger-icon')}
                            ref={hamburgerIconRef}
                            aria-label={showMobileMenu ? "Đóng menu" : "Mở menu"}
                        >
                            <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </div>

                {/* Mobile Search Box */}
                {showMobileSearch && (
                    <div className={cx('mobile-search-container')} ref={mobileSearchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyPress}
                                autoFocus
                            />
                            <button type="submit">
                                <i className="fas fa-search"></i>
                            </button>
                            <button type="button" className={cx('close-search')} onClick={toggleMobileSearch}>
                                <i className="fas fa-times"></i>
                            </button>
                        </form>
                        <div className={cx('search-suggestions')}>
                            {SEARCH_SUGGESTIONS.map((term) => (
                                <button
                                    key={term}
                                    type="button"
                                    className={cx('search-chip')}
                                    onClick={() => handleSuggestion(term)}
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                        {suggestions.length > 0 && (
                            <div className={cx('search-product-list')}>
                                <p className={cx('search-product-heading')}>Sản phẩm</p>
                                {suggestions.map((product) => (
                                    <button
                                        key={product._id}
                                        type="button"
                                        className={cx('search-product-item')}
                                        onClick={() => handleProductSuggestion(product)}
                                    >
                                        <span className={cx('search-product-thumb')}>
                                            {product.thumb ? (
                                                <img src={product.thumb} alt={product.name} />
                                            ) : (
                                                <i className="fas fa-box-open"></i>
                                            )}
                                        </span>
                                        <span className={cx('search-product-info')}>
                                            <span className={cx('search-product-name')}>{product.name}</span>
                                            <span className={cx('search-product-price')}>
                                                {formatSuggestionPrice(product.price)}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Menu */}
                {/* Con trực tiếp của <header> (không nằm trong .wrapper) —
                    .wrapper có transform + backdrop-filter nên là containing
                    block, "hạ cấp" position: fixed của menu thành absolute
                    theo .wrapper: trạng thái đóng translateX(100%) lòi
                    360px sang phải gây tràn ngang toàn trang, user lướt
                    ngang vẫn chạm được menu. Đặt ngoài .wrapper, ancestor
                    còn lại (.page-transition) cũng phải không giữ transform
                    — đã sửa PageTransition.scss keyframe kết thúc bằng
                    transform: none. */}
                <div className={cx('mobile-menu', { show: showMobileMenu })} ref={mobileMenuRef}>
                    <div className={cx('mobile-menu-header')}>
                        <button
                            className={cx('close-menu-button')}
                            onClick={closeMobileMenu}
                            aria-label="Đóng menu"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        <h2>Menu</h2>
                    </div>
                    <ul className={cx('mobile-menu-list')}>
                        <li>
                            <Link to="/products" className={cx('mobile-menu-link')} onClick={closeMobileMenu}>Sản phẩm</Link>
                        </li>
                        <li className={cx('mobile-dropdown')}>
                            <div
                                className={cx('mobile-dropdown-toggle', { active: activeMobileDropdown === 'brands' })}
                                onClick={() => toggleMobileDropdown('brands')}
                            >
                                <span>Thương hiệu</span>
                                <i className={`fas fa-chevron-down ${activeMobileDropdown === 'brands' ? cx('rotate') : ''}`}></i>
                            </div>
                            <ul className={cx('mobile-dropdown-menu', { active: activeMobileDropdown === 'brands' })}>
                                <li><a onClick={() => navigateToBrand('Gucci')}>Gucci</a></li>
                                <li><a onClick={() => navigateToBrand('Louis Vuitton')}>Louis Vuitton</a></li>
                                <li><a onClick={() => navigateToBrand('Prada')}>Prada</a></li>
                                <li><a onClick={() => navigateToBrand('Dior')}>Dior</a></li>
                                <li><a onClick={() => navigateToBrand('Balenciaga')}>Balenciaga</a></li>
                                <li><a onClick={() => navigateToBrand('Nike')}>Nike</a></li>
                                <li><a onClick={() => navigateToBrand('Adidas')}>Adidas</a></li>
                            </ul>
                        </li>
                        <li>
                            <a onClick={() => navigateToGender('Nam')} className={cx('mobile-menu-link')}>Đồ nam</a>
                        </li>
                        <li>
                            <a onClick={() => navigateToGender('Nữ')} className={cx('mobile-menu-link')}>Đồ nữ</a>
                        </li>
                        <li>
                            <Link to="/info" className={cx('mobile-menu-link')} onClick={closeMobileMenu}>Liên hệ</Link>
                        </li>

                        {!user ? (
                            <>
                                <li>
                                    <Link to="/login" className={cx('mobile-menu-link')} onClick={handleMobileLogin}>
                                        <i className="fas fa-sign-in-alt"></i> Đăng nhập
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/login?action=register" className={cx('mobile-menu-link')} onClick={handleMobileRegister}>
                                        <i className="fas fa-user-plus"></i> Đăng ký
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className={cx('mobile-dropdown')}>
                                    <div
                                        className={cx('mobile-dropdown-toggle', { active: activeMobileDropdown === 'account' })}
                                        onClick={() => toggleMobileDropdown('account')}
                                    >
                                        <span><i className="fas fa-user-circle"></i> Tài khoản</span>
                                        <i className={`fas fa-chevron-down ${activeMobileDropdown === 'account' ? cx('rotate') : ''}`}></i>
                                    </div>
                                    <ul className={cx('mobile-dropdown-menu', { active: activeMobileDropdown === 'account' })}>
                                        <li>
                                            <Link to="/profile" onClick={closeMobileMenu}>
                                                <i className="fas fa-id-card-alt"></i> Thông tin tài khoản
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/my-orders" onClick={closeMobileMenu}>
                                                <i className="fas fa-shopping-bag"></i> Các đơn của tôi
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/change-password" onClick={closeMobileMenu}>
                                                <i className="fas fa-key"></i> Đổi mật khẩu
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/settings" onClick={closeMobileMenu}>
                                                <i className="fas fa-cog"></i> Thiết lập
                                            </Link>
                                        </li>
                                        <li>
                                            <a onClick={handleLogout}>
                                                <i className="fas fa-sign-out-alt"></i> Đăng xuất
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
        </header>
    );
}

export default Header;
