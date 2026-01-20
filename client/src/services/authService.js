// src/services/authService.js
import api from './api';
import { AUTH_ENDPOINTS } from './apiEndpoints';

// Token management
const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User data and token
 */
export const register = async (userData) => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    throw new Error(errorMessage || 'Registration failed');
  }
};

/**
 * Login user
 * @param {Object} credentials - User credentials
 * @returns {Promise<Object>} User data and token
 */
export const login = async (credentials) => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    throw new Error(errorMessage || 'Login failed');
  }
};

/**
 * Get current user data
 * @returns {Promise<Object|null>} Current user data or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get(AUTH_ENDPOINTS.GET_CURRENT_USER);
    console.log("response for get profile....", response)
    return response.data.data;
  } catch (error) {
    // If token is invalid or expired, remove it
    if (error.response?.status === 401) {
      removeToken();
    }
    return null;
  }
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await api.post(AUTH_ENDPOINTS.LOGOUT);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeToken();
  }
};

/**
 * Request password reset
 * @param {string} email - User's email
 * @returns {Promise<Object>} Response data
 */
export const forgotPassword = async (email) => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    throw new Error(errorMessage || 'Password reset request failed');
  }
};

/**
 * Reset password with token
 * @param {string} token - Password reset token
 * @param {string} password - New password
 * @returns {Promise<Object>} Response data
 */
export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;
    throw new Error(errorMessage || 'Password reset failed');
  }
  localStorage.removeItem('token');
  // Optionally make a request to invalidate the token on the server
  return api.post('/auth/logout').catch(() => {
    // Even if logout fails on the server, we still want to clear the token
  });
};

/**
 * Get auth token
 * @returns {string|null} Auth token or null if not exists
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Set up auth token in headers if it exists
const token = getAuthToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default {
  register,
  login,
  logout,
  getCurrentUser,
  getAuthToken,
  isAuthenticated,
};