import Home from '../pages/Home/index.js';
import ProductDetail from '../pages/ProductDetail/index.js';
import Product from '../pages/Product/index.js';
import Cart from '../pages/Cart/index.js';
import LoginAndRegister from '../pages/LoginandRegister/index.js';
import Info from '../pages/Info/index.js';
import Checkout from '../pages/Checkout/index.js';
import Admin from '../pages/Admin/index.js';
import AdminProductDetail from '../pages/AdminProductDetail/index.js';
import AdminUserDetail from '../pages/AdminUserDetail/index.js';
import OrderConfirmation from '../pages/OrderConfirmation/index.js';
import MyOrders from '../pages/MyOrders/index.js';
import OrderDetail from '../pages/OrderDetail/index.js';
import Profile from '../pages/Profile/index.js';
import ChangePassword from '../pages/ChangePassword/index.js';
import Setting from '../pages/Setting/index.js';

const publicRoutes = [
    { path: '/', component: Home, access: 'storefront', authRequired: false },
    { path: '/products', component: Product, access: 'storefront', authRequired: false },
    { path: '/product/:id', component: ProductDetail, access: 'storefront', authRequired: false },
    { path: '/products/:id', component: ProductDetail, access: 'storefront', authRequired: false },
    { path: '/login', component: LoginAndRegister, access: 'guest-only', layout: null },
    { path: '/register', component: LoginAndRegister, access: 'guest-only', layout: null },
    { path: '/forgot-password', component: LoginAndRegister, access: 'guest-only', layout: null },
    { path: '/reset-password', component: LoginAndRegister, access: 'guest-only', layout: null },
    { path: '/info', component: Info, access: 'storefront', authRequired: false },
];

const privateRoutes = [
    { path: '/cart', component: Cart, access: 'storefront', authRequired: true },
    { path: '/checkout', component: Checkout, access: 'storefront', authRequired: true },
    { path: '/order-confirmation', component: OrderConfirmation, access: 'storefront', authRequired: true },
    { path: '/my-orders', component: MyOrders, access: 'storefront', authRequired: true },
    { path: '/order/:id', component: OrderDetail, access: 'storefront', authRequired: true },
    { path: '/profile', component: Profile, access: 'storefront', authRequired: true },
    { path: '/change-password', component: ChangePassword, access: 'storefront', authRequired: true },
    { path: '/settings', component: Setting, access: 'storefront', authRequired: true },
    { path: '/admin', component: Admin, layout: null, access: 'admin' },
    { path: '/admin/product/:id', component: AdminProductDetail, layout: null, access: 'admin' },
    { path: '/admin/products/:id', component: AdminProductDetail, layout: null, access: 'admin' },
    { path: '/admin/user/:id', component: AdminUserDetail, layout: null, access: 'admin' },
    { path: '/admin/users/:id', component: AdminUserDetail, layout: null, access: 'admin' },
];

export { publicRoutes, privateRoutes };