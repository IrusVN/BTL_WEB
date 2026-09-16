import axios from 'axios';
import { API_URL } from '../../services/authService.js';

export const CHECKOUT_REQUEST = 'CHECKOUT_REQUEST';
export const CHECKOUT_SUCCESS = 'CHECKOUT_SUCCESS';
export const CHECKOUT_FAIL = 'CHECKOUT_FAIL';
export const CHECKOUT_RESET = 'CHECKOUT_RESET';

export const PAYMENT_REQUEST = 'PAYMENT_REQUEST';
export const PAYMENT_SUCCESS = 'PAYMENT_SUCCESS';
export const PAYMENT_FAIL = 'PAYMENT_FAIL';
export const PAYMENT_RESET = 'PAYMENT_RESET';

export const CART_RESET = 'CART_RESET';
export const CART_ADD_ITEM = 'CART_ADD_ITEM';
export const CART_REMOVE_ITEM = 'CART_REMOVE_ITEM';
export const CART_UPDATE_ITEM = 'CART_UPDATE_ITEM';
export const CART_CLEAR = 'CART_CLEAR';

export const addToCart = (productId, quantity) => async (dispatch, getState) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    };

    const { data } = await axios.post(
      `${API_URL}/cart/add`,
      { productId, quantity },
      config
    );

    if (data.success) {
      const cartItem = {
        id: data.cart.items[data.cart.items.length - 1]._id,
        productId: productId,
        name: data.cart.items[data.cart.items.length - 1].product.name,
        price: data.cart.items[data.cart.items.length - 1].price,
        quantity: quantity,
        image: data.cart.items[data.cart.items.length - 1].product.images[0].url,
        stock: data.cart.items[data.cart.items.length - 1].product.stock
      };

      dispatch({
        type: CART_ADD_ITEM,
        payload: cartItem,
      });
    }
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
  }
};

export const removeFromCart = (productId) => async (dispatch, getState) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    };

    const { data } = await axios.delete(
      `${API_URL}/cart/remove/${productId}`,
      config
    );

    if (data.success) {
      dispatch({
        type: CART_REMOVE_ITEM,
        payload: productId,
      });
    }
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
  }
};

export const updateCartItem = (productId, quantity) => async (dispatch, getState) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    };

    const { data } = await axios.put(
      `${API_URL}/cart/update`,
      { itemId: productId, quantity },
      config
    );

    if (data.success) {
      const updatedItem = data.cart.items.find(item => item._id === productId);
      
      dispatch({
        type: CART_UPDATE_ITEM,
        payload: {
          productId,
          quantity,
          price: updatedItem.price,
          name: updatedItem.product.name,
          image: updatedItem.product.images[0].url,
          stock: updatedItem.product.stock,
        },
      });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật giỏ hàng:', error);
  }
};

export const clearCart = () => async (dispatch, getState) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    };

    const { data } = await axios.delete(
      `${API_URL}/cart/clear`,
      config
    );

    if (data.success) {
      dispatch({
        type: CART_CLEAR,
      });
    }
  } catch (error) {
    console.error('Lỗi khi xóa giỏ hàng:', error);
  }
};

export const createOrder = (orderData) => async (dispatch, getState) => {
  try {
    dispatch({ type: CHECKOUT_REQUEST });

    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    };

    const { data } = await axios.post(
      `${API_URL}/cart/checkout`,
      orderData,
      config
    );

    dispatch({
      type: CHECKOUT_SUCCESS,
      payload: data,
    });

    dispatch({ type: CART_RESET });

  } catch (error) {
    dispatch({
      type: CHECKOUT_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const resetCheckout = () => (dispatch) => {
  dispatch({ type: CHECKOUT_RESET });
};

export const processPayment = (paymentData) => async (dispatch, getState) => {
  try {
    dispatch({ type: PAYMENT_REQUEST });

    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    };

    const { data } = await axios.post(
      `${API_URL}/payment/process`,
      paymentData,
      config
    );

    dispatch({
      type: PAYMENT_SUCCESS,
      payload: data,
    });

  } catch (error) {
    dispatch({
      type: PAYMENT_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const resetPayment = () => (dispatch) => {
  dispatch({ type: PAYMENT_RESET });
}; 