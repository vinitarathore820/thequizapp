// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';

// Create the auth context
export const AuthContext = createContext(null);

/**
 * AuthProvider component that wraps your app and makes auth object available
 * to any child component that calls useAuth().
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user data when the app starts
  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      if (authService.isAuthenticated()) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user data');
      setUser(null);
      authService.logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for existing token and load user data on mount
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  /**
   * Login user with email and password
   * @param {Object} credentials - User credentials
   * @returns {Promise<Object>} Result of login attempt
   */
  const login = async (credentials) => {
    try {
      setError(null);
      const data = await authService.login(credentials);
      // After successful login, load user data
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setError(null);
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      // Clear any partial auth state on error
      setUser(null);
      authService.logout();
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Result of registration attempt
   */
  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      // After successful registration, load user data
      const userDataResponse = await authService.getCurrentUser();
      setUser(userDataResponse);
      setError(null);
      return { success: true, data: userDataResponse };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      // Clear any partial auth state on error
      setUser(null);
      authService.logout();
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout the current user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setError(null);
      navigate('/login');
    }
  }, [navigate]);

  // The context value that will be supplied to any descendants of this component
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access the auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};