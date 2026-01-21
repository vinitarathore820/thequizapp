// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getQuestionCount } from '../services/quizService';

const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [availableCount, setAvailableCount] = useState(0);
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('token');
  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/' } });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch question count when category changes
  const { isFetching: isFetchingCount } = useQuery({
    queryKey: ['questionCount', selectedCategory],
    queryFn: () => getQuestionCount(selectedCategory),
    enabled: !!selectedCategory,
    onSuccess: (data) => {
      setAvailableCount(data.count);
      setQuestionCount(Math.min(10, data.count));
    },
  });

  const handleStartQuiz = () => {
    if (!selectedCategory) {
      return;
    }

    navigate('/quiz/new', {
      state: {
        category: selectedCategory,
        difficulty,
        amount: questionCount,
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Select a category and start your quiz now
          </p>
        </div>

        <div className="card p-6 mb-8">
          <div className="space-y-6">
            <div className="form-group">
              <label htmlFor="category" className="label">
                Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="select"
                disabled={isLoadingCategories}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="difficulty" className="label">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="select"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between">
                <label htmlFor="questionCount" className="label">
                  Number of Questions
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {isFetchingCount ? 'Checking...' : `Max: ${availableCount} available`}
                </span>
              </div>
              <input
                type="number"
                id="questionCount"
                min="1"
                max={availableCount || 50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(parseInt(e.target.value) || 1, availableCount || 50))}
                className="input"
                disabled={!selectedCategory || isFetchingCount}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleStartQuiz}
                disabled={!selectedCategory || isFetchingCount}
                className="btn btn-primary w-full"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Quick Tips</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Select a category to see available questions</li>
            <li>• Questions are randomly selected from the Open Trivia Database</li>
            <li>• You can choose between 1 and {availableCount || '50'} questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;