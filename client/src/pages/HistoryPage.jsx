// src/pages/HistoryPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FullPageLoader from '../components/FullPageLoader';
import api from '../services/api';

const HistoryPage = () => {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const list = useMemo(() => {
    if (Array.isArray(quizzes)) return quizzes;
    return [];
  }, [quizzes]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const response = await api.get('/quizzes/history');
        const payload = response?.data;
        const data = Array.isArray(payload?.data) ? payload.data : [];
        if (mounted) setQuizzes(data);
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load quiz history';
        if (mounted) setErrorMessage(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const openResult = async (quizId) => {
    if (!quizId || isOpening) return;
    setIsOpening(true);
    try {
      const response = await api.get(`/quizzes/result/${quizId}`);
      const quiz = response?.data?.data;
      if (!quiz) {
        throw new Error('Result not found');
      }

      const total = Number.isFinite(quiz.total_questions) ? quiz.total_questions : 0;
      const score = Number.isFinite(quiz.score) ? quiz.score : 0;
      const questions = Array.isArray(quiz.questions) ? quiz.questions : [];

      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let skipped = 0;
      for (const q of questions) {
        if (q?.is_correct === true) correctAnswers += 1;
        else if (q?.is_correct === false) incorrectAnswers += 1;
        else skipped += 1;
      }

      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

      navigate('/quiz/result', {
        state: {
          quizId: quiz._id,
          score,
          total,
          percentage,
          correctAnswers,
          incorrectAnswers,
          skipped,
          status: quiz.status,
          pointsEarned: quiz.pointsEarned,
          category: quiz.category,
          difficulty: quiz.difficulty,
          typeId: quiz.typeId,
          categoryId: quiz.categoryRef || quiz.categoryId,
          quizType: quiz.quizType
        }
      });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to open quiz result';
      setErrorMessage(msg);
    } finally {
      setIsOpening(false);
    }
  };

  if (isLoading || isOpening) {
    return (
      <FullPageLoader
        message={isOpening ? 'Opening result...' : 'Loading your quiz history...'}
        className="bg-gray-50 dark:bg-gray-900"
      />
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="alert alert-error">
            <div className="flex items-center">

              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center justify-between">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz History</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              A list of all the quizzes you've taken.
            </p>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="mt-8 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">

              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No quizzes yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Take your first quiz to see your history here.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {list.map((quiz) => {
              const total = Number.isFinite(quiz.totalQuestions) ? quiz.totalQuestions : (Number.isFinite(quiz.total_questions) ? quiz.total_questions : 0);
              const score = Number.isFinite(quiz.score) ? quiz.score : 0;
              const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
              const isPassing = percentage >= 70;
              const completedAt = quiz.completedAt ? new Date(quiz.completedAt) : null;

              return (
                <button
                  key={quiz._id}
                  type="button"
                  onClick={() => openResult(quiz._id)}
                  className="w-full text-left card p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {quiz.category || 'Quiz'}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {completedAt ? format(completedAt, 'MMM d, yyyy • hh:mm a') : 'In progress'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isPassing
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {percentage}%
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 capitalize">
                        {quiz.difficulty || 'medium'}
                      </span>
                      {typeof quiz.pointsEarned === 'number' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                          +{quiz.pointsEarned} pts
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Score</div>
                      <div className="text-base font-semibold text-gray-900 dark:text-white">{score}/{total}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                      <div className="text-base font-semibold text-gray-900 dark:text-white capitalize">{quiz.status || 'completed'}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
                      <div className="text-base font-semibold text-gray-900 dark:text-white">{quiz.quizType || '—'}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Tap to view</div>
                      <div className="text-base font-semibold text-primary-600 dark:text-primary-400">Result</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;