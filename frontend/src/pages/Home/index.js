import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import { useNavigate, Link } from 'react-router-dom';
import * as styles from './Home.module.scss';
import { useSlider } from './home.js';
import ProductItem from '../../components/ProductItem/index.js';
import { getProducts } from '../../services/productService.js';
import { showToast } from '../../components/Toast/index.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
// Import logo images
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
        { name: 'Gucci', logo: logoGucci },
        { name: 'Louis Vuitton', logo: logoLV },
        { name: 'Nike', logo: logoNike },
        { name: 'Prada', logo: logoPrada }
    ];

    // Refs cho các container sản phẩm
    const productsRef = useRef(null);
    const nikeProductsRef = useRef(null);
    const gucciProductsRef = useRef(null);
    const diorProductsRef = useRef(null);

    useEffect(() => {
        // Số sản phẩm hiển thị tối đa mỗi section
        const MAX_PRODUCTS = 8;

        const fetchProducts = async () => {
            try {
                // Gọi song song 4 request: sản phẩm nổi bật + 3 brand, mỗi request
                // chỉ lấy đúng số sản phẩm cần hiển thị thay vì fetch cả catalog
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

    // Hàm scroll sản phẩm
    const scrollProducts = (ref, direction) => {
        if (!ref.current) return;
        
        const container = ref.current;
        const scrollAmount = container.clientWidth;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        if (direction === 'right') {
            if (container.scrollLeft >= maxScroll - 10) {
                // Nếu đã ở cuối, quay lại đầu
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        } else {
            if (container.scrollLeft <= 10) {
                // Nếu đã ở đầu, chuyển đến cuối
                container.scrollTo({ left: maxScroll, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
        }
    };

    // Component hiển thị danh sách sản phẩm với nút điều khiển
    const ProductsSection = ({ title, products, loading, error, containerRef }) => {
        // Hiển thị tối đa 8 sản phẩm thay vì 5 để có thêm sản phẩm để vuốt trên mobile
        const maxProducts = products?.slice(0, 8) || [];
        const [isUserScrolling, setIsUserScrolling] = useState(false);
        const scrollTimeoutRef = useRef(null);
        
        // Thêm xử lý touch cho mobile
        const handleTouchStart = (e) => {
            // Người dùng bắt đầu vuốt, đánh dấu đang vuốt
            setIsUserScrolling(true);
            
            // Hủy timeout trước đó nếu có
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
        
        const handleTouchEnd = (e) => {
            // Sau khi kết thúc vuốt, đặt timeout để duy trì vị trí cuộn hiện tại
            scrollTimeoutRef.current = setTimeout(() => {
                setIsUserScrolling(false);
            }, 10000); // Đợi 10 giây trước khi reset trạng thái vuốt
        };
        
        // Thêm sự kiện scroll để xử lý khi người dùng scroll chuột trên desktop
        const handleScroll = () => {
            setIsUserScrolling(true);
            
            // Hủy timeout trước đó nếu có
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            
            // Đặt timeout để reset trạng thái sau khi scroll dừng
            scrollTimeoutRef.current = setTimeout(() => {
                setIsUserScrolling(false);
            }, 10000); // Đợi 10 giây trước khi reset trạng thái vuốt
        };
        
        // Cleanup timer khi component unmount
        useEffect(() => {
            return () => {
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
            };
        }, []);
        
        return (
            <div>
                <h2 className={cx('section-title')}>{title}</h2>
                <div className={cx('products-wrapper')}>
                    <div 
                        className={cx('products-grid')} 
                        ref={containerRef}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onScroll={handleScroll}
                        data-user-scrolling={isUserScrolling}
                    >
                        {loading ? (
                            <div className={cx('loading')}>Đang tải...</div>
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
            
            <div className={cx('container')}>
                {/* Sản phẩm nổi bật */}
                <ProductsSection 
                    title="Sản phẩm nổi bật" 
                    products={products} 
                    loading={loading} 
                    error={error} 
                    containerRef={productsRef}
                />
                
                {/* Nike products */}
                <ProductsSection 
                    title="Nike" 
                    products={nikeProducts} 
                    loading={loading} 
                    error={error} 
                    containerRef={nikeProductsRef}
                />
                
                {/* Gucci products */}
                <ProductsSection 
                    title="Gucci" 
                    products={gucciProducts} 
                    loading={loading} 
                    error={error} 
                    containerRef={gucciProductsRef}
                />
                
                {/* Dior products */}
                <ProductsSection 
                    title="Dior" 
                    products={diorProducts} 
                    loading={loading} 
                    error={error} 
                    containerRef={diorProductsRef}
                />

                {/* Brands */}
                <h2 className={cx('section-title')}>Thương hiệu của chúng tôi</h2>
                <div className={cx('brands-container')}>
                    {brands.map((brand, index) => (
                        <div 
                            key={index} 
                            className={cx('brand-item')}
                            onClick={() => handleBrandClick(brand.name)}
                            aria-label={`Thương hiệu ${brand.name}`}
                        >
                            <img src={brand.logo} alt={brand.name} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Home;

