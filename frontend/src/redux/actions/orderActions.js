import axios from 'axios';
import { API_URL } from '../../services/authService.js';
import {
  ORDER_LIST_MY_REQUEST,
  ORDER_LIST_MY_SUCCESS,
  ORDER_LIST_MY_FAIL,
  ORDER_LIST_MY_RESET,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
  CHECKOUT_REQUEST,
  CHECKOUT_SUCCESS,
  CHECKOUT_FAIL,
  CHECKOUT_RESET,
  PAYMENT_REQUEST,
  PAYMENT_SUCCESS,
  PAYMENT_FAIL,
  PAYMENT_RESET
} from '../constants/orderConstants.js';

export const listMyOrders = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_LIST_MY_REQUEST });

    const token = localStorage.getItem('token');

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    };

    const { data } = await axios.get(`${API_URL}/orders/me`, config);

    dispatch({
      type: ORDER_LIST_MY_SUCCESS,
      payload: data.orders,
    });
  } catch (error) {
    dispatch({
      type: ORDER_LIST_MY_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const getOrderDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_DETAILS_REQUEST });

    const token = localStorage.getItem('token');

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    };

    const { data } = await axios.get(`${API_URL}/orders/${id}`, config);

    dispatch({
      type: ORDER_DETAILS_SUCCESS,
      payload: data.order,
    });
  } catch (error) {
    dispatch({
      type: ORDER_DETAILS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const resetMyOrders = () => (dispatch) => {
  dispatch({ type: ORDER_LIST_MY_RESET });
};

export const createOrder = (orderData) => async (dispatch, getState) => {
  try {
    dispatch({ type: CHECKOUT_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
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

export const processPayment = (orderId, paymentResult) => async (dispatch, getState) => {
  try {
    dispatch({ type: PAYMENT_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
      withCredentials: true
    };

    const { data } = await axios.put(
      `${API_URL}/order/${orderId}/pay`,
      paymentResult,
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