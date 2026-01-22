// src/components/layout/Layout.jsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import api from '../../services/api';
import * as authService from '../../services/authService';
import { logs as logsIcon } from '../../assets';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('token');

  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    delete axios.defaults.headers.common.Authorization;
    delete api.defaults.headers.common.Authorization;

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
          <Link to="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
            QuizApp
          </Link>
          <nav className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user?.name ? (
                  <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200">
                    Welcome, {String(user.name).trim().split(/\s+/)[0]}
                  </span>
                ) : null}
                <Link
                  to="/history"
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/history'
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Quizzes"
                >
                  <img src={logsIcon} alt="" className="h-5 w-5" />
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-800 dark:hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors"
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