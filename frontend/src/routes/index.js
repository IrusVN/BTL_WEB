import Home from '../pages/Home/index.js';
import ProductDetail from '../pages/ProductDetail/index.js';
import Product from '../pages/Product/index.js';
import Cart from '../pages/Cart/index.js';
import LoginAndRegister from '../pages/LoginandRegister/index.js';
import Info from '../pages/Info/index.js';
import Checkout from '../pages/Checkout/index.js';
import Admin from '../pages/Admin/index.js';
import AdminProductDetail from '../pages/AdminProductDetail/index.js';
import OrderConfirmation from '../pages/OrderConfirmation/index.js';
import MyOrders from '../pages/MyOrders/index.js';
import OrderDetail from '../pages/OrderDetail/index.js';
import Profile from '../pages/Profile/index.js';
import ChangePassword from '../pages/ChangePassword/index.js';
import Setting from '../pages/Setting/index.js';

const publicRoutes = [
    { path: '/', component: Home },
    { path: '/products', component: Product },
    { path: '/product/:id', component: ProductDetail },
    { path: '/products/:id', component: ProductDetail },
    { path: '/login', component: LoginAndRegister},
    { path: '/info', component: Info},
]

const privateRoutes = [
    { path: '/cart', component: Cart},
    { path: '/checkout', component: Checkout },
    { path: '/admin', component: Admin, layout: null},
    { path: '/admin/product/:id', component: AdminProductDetail, layout: null },
    { path: '/admin/products/:id', component: AdminProductDetail, layout: null },
    { path: '/order-confirmation', component: OrderConfirmation },
    { path: '/my-orders', component: MyOrders },
    { path: '/order/:id', component: OrderDetail },
    { path: '/profile', component: Profile },
    { path: '/change-password', component: ChangePassword },
    { path: '/settings', component: Setting },
]

export { publicRoutes, privateRoutes };