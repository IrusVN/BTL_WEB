import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

import { cartReducer } from './redux/reducers/cartReducers.js';
import { 
  orderListMyReducer, 
  orderDetailsReducer,
  checkoutReducer,
  paymentReducer 
} from './redux/reducers/orderReducers.js';

const userLoginReducer = (state = { userInfo: null }, action) => {
  switch (action.type) {
    case 'USER_LOGIN_SUCCESS':
      return { userInfo: action.payload };
    case 'USER_LOGOUT':
      return { userInfo: null };
    default:
      return state;
  }
};

const reducer = combineReducers({
  cart: cartReducer,
  checkout: checkoutReducer,
  payment: paymentReducer,
  userLogin: userLoginReducer,
  orderListMy: orderListMyReducer,
  orderDetails: orderDetailsReducer,
});

const cartItemsFromStorage = localStorage.getItem('cartItems')
  ? JSON.parse(localStorage.getItem('cartItems'))
  : [];

const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const initialState = {
  cart: { cartItems: cartItemsFromStorage },
  userLogin: { userInfo: userInfoFromStorage },
};

const middleware = [thunk];

const store = createStore(
  reducer,
  initialState,
  applyMiddleware(...middleware)
);

export default store; 