// src/pages/QuizResultPage.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import Lottie from 'lottie-react';
import { failed, failed1, passed, passed1 } from '../assets';

const QuizResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const state = location.state || {};

  const result = {
    score: Number.isFinite(state.score) ? state.score : 0,
    total: Number.isFinite(state.total) ? state.total : 0,
    category: state.category || 'General Knowledge',
    difficulty: state.difficulty || 'medium',
    typeId: state.typeId,
    categoryId: state.categoryId,
    quizType: state.quizType,
    correctAnswers: Number.isFinite(state.correctAnswers) ? state.correctAnswers : (Number.isFinite(state.score) ? state.score : 0),
    incorrectAnswers: Number.isFinite(state.incorrectAnswers) ? state.incorrectAnswers : 0,
    skipped: Number.isFinite(state.skipped) ? state.skipped : 0,
    pointsEarned: Number.isFinite(state.pointsEarned) ? state.pointsEarned : undefined,
    status: state.status
  };

  const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const isPerfectScore = result.total > 0 && result.score === result.total;
  const isPassingScore = percentage >= 70;
  const animationData = isPassingScore ? passed1 : failed1;

  useEffect(() => {
    if (navigationType === 'POP') {
      navigate('/', { replace: true });
    }
  }, [navigationType, navigate]);

  if (navigationType === 'POP') return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card p-6 sm:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {isPerfectScore ? 'Perfect Score!' : isPassingScore ? 'Quiz Passed' : 'Quiz Failed'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                You scored <span className="font-semibold text-gray-900 dark:text-white">{result.score}</span>
                {' '}out of <span className="font-semibold text-gray-900 dark:text-white">{result.total}</span>
                {' '}({percentage}%).
              </p>
              {typeof result.pointsEarned === 'number' ? (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Points earned: <span className="font-semibold text-primary-600 dark:text-primary-400">{result.pointsEarned}</span>
                </p>
              ) : null}
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="w-56 sm:w-64">
                <Lottie animationData={animationData} loop autoplay />
              </div>
            </div>
          </div>
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
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary w-full sm:w-1/2"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/quiz/new', { state: { typeId: result.typeId, categoryId: result.categoryId, quizType: result.quizType, category: result.category, difficulty: result.difficulty } })}
            className="w-full sm:w-1/2 inline-flex items-center justify-center px-5 py-3 rounded-lg border border-primary-600 text-primary-600 bg-transparent hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultPage;