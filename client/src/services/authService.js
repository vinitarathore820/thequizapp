// src/services/authService.js
import axios from 'axios';
import { API_URL } from './api';

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { data, status } = error.response;
      let errorMessage = 'An error occurred';

      if (data && data.message) {
        errorMessage = data.message;
      } else if (status === 401) {
        errorMessage = 'Unauthorized access. Please login again.';
      } else if (status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      } else if (status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject(new Error('Request error. Please try again.'));
    }
  }
);

// Register a new user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    // If unauthorized, clear any existing token
    if (error.message.includes('401')) {
      localStorage.removeItem('token');
    }
    throw error;
  }
};

// Logout user
export const logout = () => {
  // Clear token from localStorage
  localStorage.removeItem('token');
  // Clear token from HTTP-only cookie by making a request to the backend
  return api.post('/auth/logout');
};

// Set auth token in the headers
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize auth token from localStorage if it exists
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

export default {
  register,
  login,
  logout,
  getMe,
  setAuthToken,
};