// src/pages/ProfilePage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getQuizStats } from '../services/quizService';

const ProfilePage = () => {
  const navigate = useNavigate();

  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const userId = user?.id || user?._id;

  const { data: stats, isLoading } = useQuery(
    ['userStats', userId],
    () => getQuizStats(userId),
    { enabled: !!userId }
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="text-2xl font-medium text-gray-900 dark:text-white mb-4">
            Please sign in to view your profile
          </div>
          <Link
            to="/login"
            className="btn btn-primary mt-4"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Profile
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Your personal information and quiz statistics
              </p>
            </div>
            <button
              onClick={logout}
              className="mt-4 sm:mt-0 btn btn-outline btn-error"
            >
              Sign Out
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Personal Information
                </h4>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Full Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user.name || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Member since
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Quiz Statistics
                </h4>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : (
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total Quizzes Taken
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.totalQuizzes || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Average Score
                      </dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.averageScore ? `${Math.round(stats.averageScore)}%` : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Favorite Category
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {stats?.favoriteCategory || 'N/A'}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6 text-right">
            <Link
              to="/history"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View Quiz History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;