// src/components/layout/Layout.jsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import api from '../../services/api';
import * as authService from '../../services/authService';
import { quizzzyLogo } from '../../assets';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();

  const isQuizTakingRoute =
    location.pathname === '/quiz/new' || /^\/quiz\/[0-9a-fA-F]{24}$/.test(location.pathname);

  const isAuthenticated = !!localStorage.getItem('token');

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    delete axios.defaults.headers.common.Authorization;
    delete api.defaults.headers.common.Authorization;

    window.dispatchEvent(new Event('auth:changed'));

    navigate('/login', { replace: true });

    try {
      await authService.logout();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {isQuizTakingRoute ? (
            <span className="inline-flex items-center gap-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400 select-none cursor-default">
              <img src={quizzzyLogo} alt="Quizzzy" className="h-9 w-9" />
              <span>Quizzzy</span>
            </span>
          ) : (
            <Link to="/" className="inline-flex items-center gap-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              <img src={quizzzyLogo} alt="Quizzzy" className="h-9 w-9" />
              <span>Quizzzy</span>
            </Link>
          )}
          <nav className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors transition-transform hover:scale-105 active:scale-95"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            {isAuthenticated && !isQuizTakingRoute ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/leaderboard"
                  className={`inline-flex items-center justify-center p-2 rounded-full transition-colors transition-transform hover:scale-105 active:scale-95 ${
                    location.pathname === '/leaderboard'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Leaderboard"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                    <path d="M7 4h10v3a5 5 0 0 1-10 0V4z" />
                    <path d="M7 7H5a2 2 0 0 1-2-2V4h4" />
                    <path d="M17 7h2a2 2 0 0 0 2-2V4h-4" />
                  </svg>
                </Link>
                <Link
                  to="/history"
                  className={`inline-flex items-center justify-center p-2 rounded-full transition-colors transition-transform hover:scale-105 active:scale-95 ${
                    location.pathname === '/history'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Quizzes"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12h.01" />
                    <path d="M4 6h.01" />
                    <path d="M4 18h.01" />
                    <path d="M8 18h2" />
                    <path d="M8 12h2" />
                    <path d="M8 6h2" />
                    <path d="M14 6h6" />
                    <path d="M14 12h6" />
                    <path d="M14 18h6" />
                  </svg>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-800 dark:hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors transition-transform hover:scale-105 active:scale-95"
                  aria-label="Logout"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="h-8">
                {/* Empty div to maintain layout spacing */}
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;