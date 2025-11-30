// src/pages/NotFoundPage.jsx
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const NotFoundPage = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-primary-600 dark:text-primary-500">404</p>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white tracking-tight sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="btn btn-primary px-4 py-2 text-base font-medium"
          >
            <span>Go back home</span>
          </Link>
          <a
            href="mailto:support@quizapp.com"
            className="btn btn-outline px-4 py-2 text-base font-medium"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;