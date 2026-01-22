// src/pages/QuizResultPage.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { getQuizResult } from '../services/quizService';
import FullPageLoader from '../components/FullPageLoader';

const QuizResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { score, total, category, difficulty } = location.state || {};

  // If we have the score in location state, use that
  // Otherwise, fetch the result from the server if we have a quizId
  const { data: result, isLoading, error } = useQuery({
    queryKey: ['quizResult', location.state?.quizId],
    queryFn: () => getQuizResult(location.state?.quizId),
    enabled: !!location.state?.quizId,
    initialData: location.state?.score !== undefined ? {
      score: location.state.score,
      total: location.state.total,
      category: location.state.category,
      difficulty: location.state.difficulty,
      correctAnswers: location.state.correctAnswers || 0,
      incorrectAnswers: location.state.incorrectAnswers || 0,
      skipped: location.state.skipped || 0,
      timeSpent: location.state.timeSpent || '00:00',
    } : undefined,
  });

  if (isLoading) {
    return (
      <FullPageLoader message="Loading your results..." className="bg-gray-50 dark:bg-gray-900" />
    );
  }

  if (error || !result) {
    return (
      <FullPageLoader message="Error loading results. Please try again." className="bg-gray-50 dark:bg-gray-900" />
    );
  }

  const percentage = Math.round((result.score / result.total) * 100);
  const isPerfectScore = result.score === result.total;
  const isPassingScore = percentage >= 70;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {isPerfectScore ? 'Perfect Score! 🎉' : isPassingScore ? 'Quiz Complete! 🎯' : 'Quiz Results'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            You scored {result.score} out of {result.total} ({percentage}%)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Score Card */}
          <div className="card p-6 text-center">
            <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {result.score}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Correct Answers</div>
          </div>

          {/* Accuracy Card */}
          <div className="card p-6 text-center">
            <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {percentage}%
            </div>
            <div className="text-gray-500 dark:text-gray-400">Accuracy</div>
          </div>

          {/* Difficulty Card */}
          <div className="card p-6 text-center">
            <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {result.difficulty ? result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1) : 'N/A'}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Difficulty</div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Detailed Results</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 dark:text-gray-300">Correct Answers</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {result.correctAnswers || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-green-500 h-2.5 rounded-full"
                  style={{ width: `${(result.correctAnswers / result.total) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 dark:text-gray-300">Incorrect Answers</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {result.incorrectAnswers || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-red-500 h-2.5 rounded-full"
                  style={{ width: `${((result.incorrectAnswers || 0) / result.total) * 100}%` }}
                ></div>
              </div>
            </div>

            {result.skipped > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 dark:text-gray-300">Skipped Questions</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {result.skipped}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-yellow-500 h-2.5 rounded-full"
                    style={{ width: `${(result.skipped / result.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Summary */}
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Quiz Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Category:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">
                  {result.category || 'General Knowledge'}
                </span>
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Difficulty:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200 capitalize">
                  {result.difficulty || 'Mixed'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Total Questions:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">{result.total}</span>
              </p>
              {result.timeSpent && (
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Time Spent:</span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">{result.timeSpent}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary flex-1 sm:flex-none sm:w-auto"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/quiz/new', { state: { category, difficulty } })}
            className="btn btn-outline flex-1 sm:flex-none sm:w-auto"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              // Share functionality can be implemented here
              if (navigator.share) {
                navigator.share({
                  title: 'My Quiz Results',
                  text: `I scored ${result.score} out of ${result.total} (${percentage}%) on the ${result.category} quiz! Can you beat my score?`,
                  url: window.location.href,
                }).catch(console.error);
              } else {
                // Fallback for browsers that don't support Web Share API
                navigator.clipboard.writeText(
                  `I scored ${result.score}/${result.total} (${percentage}%) on the ${result.category} quiz! Can you beat my score?`
                );
                alert('Results copied to clipboard!');
              }
            }}
            className="btn btn-outline flex-1 sm:flex-none sm:w-auto"
          >
            Share Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultPage;