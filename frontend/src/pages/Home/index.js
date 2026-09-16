import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import { useNavigate, Link } from 'react-router-dom';
import * as styles from './Home.module.scss';
import { useSlider } from './home.js';
import ProductItem from '../../components/ProductItem/index.js';
import { getProducts } from '../../services/productService.js';
import { showToast } from '../../components/Toast/index.js';
import { useHead } from '../../hooks/useHead.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import logoAdidas from '../../img/Logo/logo_adidas.png';
import logoBalenciaga from '../../img/Logo/logo_balenciaga.png';
import logoDior from '../../img/Logo/logo_dior.png';
import logoGucci from '../../img/Logo/logo_gucci.jpg';
import logoLV from '../../img/Logo/logo_lv.jpg';
import logoNike from '../../img/Logo/logo_nike.png';
import logoPrada from '../../img/Logo/logo_prada.png';

const cx = classNames.bind(styles);

function Home() {
    const navigate = useNavigate();
    useHead('Team2hand — Thời trang chính hãng');
    const { 
        currentSlide, 
        slides, 
        goToSlide, 
        goToPrevSlide, 
        goToNextSlide,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    } = useSlider();
    const [products, setProducts] = useState([]);
    const [nikeProducts, setNikeProducts] = useState([]);
    const [gucciProducts, setGucciProducts] = useState([]);
    const [diorProducts, setDiorProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const brands = [
        { name: 'Adidas', logo: logoAdidas },
        { name: 'Balenciaga', logo: logoBalenciaga },
        { name: 'Dior', logo: logoDior },
        { name: 'Gucci', logo: logoGucci, blend: true },
        { name: 'Louis Vuitton', logo: logoLV, blend: true },
        { name: 'Nike', logo: logoNike },
        { name: 'Prada', logo: logoPrada }
    ];

    const productsRef = useRef(null);
    const nikeProductsRef = useRef(null);
    const gucciProductsRef = useRef(null);
    const diorProductsRef = useRef(null);

    useEffect(() => {
        const MAX_PRODUCTS = 8;

        const fetchProducts = async () => {
            try {
                const [featuredRes, nikeRes, gucciRes, diorRes] = await Promise.all([
                    getProducts({ limit: MAX_PRODUCTS }),
                    getProducts({ brand: 'Nike', limit: MAX_PRODUCTS }),
                    getProducts({ brand: 'Gucci', limit: MAX_PRODUCTS }),
                    getProducts({ brand: 'Dior', limit: MAX_PRODUCTS })
                ]);

                if (featuredRes.success) setProducts(featuredRes.products);
                if (nikeRes.success) setNikeProducts(nikeRes.products);
                if (gucciRes.success) setGucciProducts(gucciRes.products);
                if (diorRes.success) setDiorProducts(diorRes.products);

                setLoading(false);
            } catch (error) {
                console.error('Lỗi khi lấy sản phẩm:', error);
                setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
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

    const handleBrandClick = (brandName) => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            navigate(`/products?brand=${brandName}`);
        }, 600);
    };

    const scrollProducts = (ref, direction) => {
        if (!ref.current) return;
        
        const container = ref.current;
        const scrollAmount = container.clientWidth;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (direction === 'right') {
            if (container.scrollLeft >= maxScroll - 10) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        } else {
            if (container.scrollLeft <= 10) {
                container.scrollTo({ left: maxScroll, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const ProductsSection = ({ title, products, loading, error, containerRef, viewAllLink }) => {
        const maxProducts = products?.slice(0, 8) || [];
        const [isUserScrolling, setIsUserScrolling] = useState(false);
        const scrollTimeoutRef = useRef(null);

        const handleTouchStart = (e) => {
            setIsUserScrolling(true);

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };

        const handleTouchEnd = (e) => {
            scrollTimeoutRef.current = setTimeout(() => {
                setIsUserScrolling(false);
            }, 10000);
        };

        const handleScroll = () => {
            setIsUserScrolling(true);

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                setIsUserScrolling(false);
            }, 10000);
        };

        useEffect(() => {
            return () => {
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
            };
        }, []);

        return (
            <section className={cx('products-section')}>
                <div className={cx('container')}>
                    <div className={cx('section-header')}>
                        <h2 className={cx('section-title')}>{title}</h2>
                        {viewAllLink && (
                            <Link className={cx('view-all')} to={viewAllLink}>Xem tất cả →</Link>
                        )}
                    </div>
                    <div className={cx('products-wrapper')}>
                        <button
                            className={cx('rail-arrow', 'rail-prev')}
                            onClick={() => scrollProducts(containerRef, 'left')}
                            aria-label="Cuộn sang trái"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button
                            className={cx('rail-arrow', 'rail-next')}
                            onClick={() => scrollProducts(containerRef, 'right')}
                            aria-label="Cuộn sang phải"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                        <div
                            className={cx('products-grid')}
                            ref={containerRef}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                            onScroll={handleScroll}
                            data-user-scrolling={isUserScrolling}
                        >
                            {loading ? (
                                [0, 1, 2, 3].map((i) => (
                                    <div key={i} className={cx('skeleton-card')}>
                                        <div className={cx('skeleton-image')}></div>
                                        <div className={cx('skeleton-line')}></div>
                                        <div className={cx('skeleton-line', 'skeleton-line-short')}></div>
                                    </div>
                                ))
                            ) : error ? (
                                <div className={cx('error')}>Có lỗi xảy ra: {error}</div>
                            ) : maxProducts.length === 0 ? (
                                <div className={cx('no-products')}>Không có sản phẩm nào</div>
                            ) : (
                                maxProducts.map((product) => (
                                    <div key={product._id} className={cx('product-item')}>
                                        <ProductItem product={product} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('slider')}>
                <div 
                    className={cx('slides')}
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {slides.map((slide, index) => (
                        <div 
                            key={index} 
                            className={`${cx('slide')} ${currentSlide === index ? cx('active') : ''}`}
                        >
                            <img src={slide.image} alt={`Slide ${index + 1}`} />
                            <div className={cx('slideContent')}>
                                <h2>{slide.title}</h2>
                                <p>{slide.description}</p>
                                <button>{slide.buttonText}</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={cx('controls')}>
                    <div className={cx('control')} onClick={goToPrevSlide} aria-label="Slide trước">
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </div>
                    <div className={cx('control')} onClick={goToNextSlide} aria-label="Slide sau">
                        <FontAwesomeIcon icon={faChevronRight} />
                    </div>
                </div>

                <div className={cx('dots')}>
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`${cx('dot')} ${currentSlide === index ? cx('active') : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
            
            {/* Sản phẩm nổi bật */}
            <ProductsSection
                title="Sản phẩm nổi bật"
                products={products}
                loading={loading}
                error={error}
                containerRef={productsRef}
                viewAllLink="/products"
            />

            {/* Nike products */}
            <ProductsSection
                title="Nike"
                products={nikeProducts}
                loading={loading}
                error={error}
                containerRef={nikeProductsRef}
                viewAllLink="/products?brand=Nike"
            />

            {/* Gucci products */}
            <ProductsSection
                title="Gucci"
                products={gucciProducts}
                loading={loading}
                error={error}
                containerRef={gucciProductsRef}
                viewAllLink="/products?brand=Gucci"
            />

            {/* Dior products */}
            <ProductsSection
                title="Dior"
                products={diorProducts}
                loading={loading}
                error={error}
                containerRef={diorProductsRef}
                viewAllLink="/products?brand=Dior"
            />

            {/* Brands */}
            <section className={cx('brands-section')}>
                <div className={cx('container')}>
                    <h2 className={cx('section-title')}>Thương hiệu của chúng tôi</h2>
                    <div className={cx('brands-container')}>
                        {brands.map((brand, index) => (
                            <div
                                key={index}
                                className={cx('brand-item')}
                                onClick={() => handleBrandClick(brand.name)}
                                aria-label={`Thương hiệu ${brand.name}`}
                            >
                                <img src={brand.logo} alt={brand.name} className={brand.blend ? cx('logo-blend') : undefined} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;

