import {
  ORDER_CREATE_REQUEST,
  ORDER_CREATE_SUCCESS,
  ORDER_CREATE_FAIL,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
  ORDER_LIST_MY_REQUEST,
  ORDER_LIST_MY_SUCCESS,
  ORDER_LIST_MY_FAIL,
  ORDER_LIST_MY_RESET,
  CHECKOUT_REQUEST,
  CHECKOUT_SUCCESS,
  CHECKOUT_FAIL,
  CHECKOUT_RESET,
  PAYMENT_REQUEST,
  PAYMENT_SUCCESS,
  PAYMENT_FAIL,
  PAYMENT_RESET
} from '../constants/orderConstants.js';

export const orderListMyReducer = (state = { orders: [] }, action) => {
  switch (action.type) {
    case ORDER_LIST_MY_REQUEST:
      return {
        loading: true,
      };
    case ORDER_LIST_MY_SUCCESS:
      return {
        loading: false,
        orders: action.payload,
      };
    case ORDER_LIST_MY_FAIL:
      return {
        loading: false,
        error: action.payload,
      };
    case ORDER_LIST_MY_RESET:
      return { orders: [] };
    default:
      return state;
  }
};

export const orderDetailsReducer = (
  state = { loading: true, orderItems: [], shippingAddress: {} },
  action
) => {
  switch (action.type) {
    case ORDER_DETAILS_REQUEST:
      return {
        ...state,
        loading: true,
      };
    case ORDER_DETAILS_SUCCESS:
      return {
        loading: false,
        order: action.payload,
      };
    case ORDER_DETAILS_FAIL:
      return {
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export const checkoutReducer = (state = {}, action) => {
  switch (action.type) {
    case CHECKOUT_REQUEST:
      return { loading: true };
    case CHECKOUT_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case CHECKOUT_FAIL:
      return { loading: false, error: action.payload };
    case CHECKOUT_RESET:
      return {};
    default:
      return state;
  }
};

export const paymentReducer = (state = {}, action) => {
  switch (action.type) {
    case PAYMENT_REQUEST:
      return { loading: true };
    case PAYMENT_SUCCESS:
      return { loading: false, success: true, paymentResult: action.payload };
    case PAYMENT_FAIL:
      return { loading: false, error: action.payload };
    case PAYMENT_RESET:
      return {};
    default:
      return state;
  }
}; 