/**
 * API Endpoints for the application
 * This file contains all the API endpoint URLs used in the application
 */

export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  GET_CURRENT_USER: '/auth/me',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION_EMAIL: '/auth/resend-verification-email'
};

// Export all endpoints as a single object
export default {
  ...AUTH_ENDPOINTS
};
