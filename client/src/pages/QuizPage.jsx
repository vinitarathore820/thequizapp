// src/pages/QuizPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../services/api';
import { left, right } from '../assets';
import QuestionCard from '../components/quiz/QuestionCard';
import FullPageLoader from '../components/FullPageLoader';

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const clientDebugDurationMs = null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [quizId, setQuizId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersById, setAnswersById] = useState({});

  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeftMs, setTimeLeftMs] = useState(null);

  const submittingRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  const { typeId, categoryId, difficulty = 'medium', quizType, category } = location.state || {};

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const current = questions[currentIndex];

  const selectedValue = current ? (answersById[current.questionId] ?? '') : '';
  const isAllAnswered = questions.length > 0 && Object.keys(answersById).length === questions.length;

  const formattedTimeLeft = useMemo(() => {
    if (timeLeftMs == null) return '--:--';
    const totalSec = Math.floor(timeLeftMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [timeLeftMs]);

  useEffect(() => {
    if (navigationType === 'POP') {
      navigate('/', { replace: true });
    }
  }, [navigationType, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }

    if (!typeId || !categoryId) {
      navigate('/', { replace: true });
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await axios.post(
          `${API_URL}/quizzes/start`,
          { typeId, categoryId, difficulty, quizType },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const payload = response?.data;
        const qList = Array.isArray(payload?.questions) ? payload.questions : [];

        if (!mounted) return;

        setQuizId(payload?.quizId || '');
        setQuestions(qList);
        setCurrentIndex(0);
        setAnswersById({});
        setExpiresAt(
          clientDebugDurationMs
            ? new Date(Date.now() + clientDebugDurationMs)
            : (payload?.expiresAt ? new Date(payload.expiresAt) : null)
        );
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || 'Failed to start quiz';
        if (mounted) setErrorMessage(msg);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [typeId, categoryId, difficulty, quizType, navigate, location]);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const remaining = expiresAt.getTime() - Date.now();
      setTimeLeftMs(Math.max(0, remaining));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const handleSubmit = async ({ mode } = {}) => {
    if (!quizId || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      const answersPayload = questions.map((q) => ({
        questionId: q.questionId,
        answer: answersById[q.questionId] ?? null
      }));

      const response = await axios.post(
        `${API_URL}/quizzes/${quizId}/submit`,
        { answers: answersPayload },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = response?.data || {};

      navigate('/quiz/result', {
        replace: true,
        state: {
          quizId,
          ...result,
          typeId,
          categoryId,
          quizType,
          category: category || location.state?.category || 'General Knowledge',
          difficulty: difficulty || 'medium'
        }
      });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to submit quiz';
      setErrorMessage(msg);
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!quizId) return;
    if (timeLeftMs == null) return;
    if (timeLeftMs > 0) return;
    if (autoSubmittedRef.current) return;

    autoSubmittedRef.current = true;
    handleSubmit({ mode: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftMs, quizId]);

  const handleSelect = (value) => {
    if (!current) return;
    setAnswersById((prev) => ({ ...prev, [current.questionId]: value }));
  };

  const handleFinish = () => {
    if (!isAllAnswered) return;
    handleSubmit({ mode: 'manual' });
  };

  if (isLoading || isSubmitting) {
    return (
      <FullPageLoader
        message={isSubmitting ? 'Submitting quiz...' : 'Starting quiz...'}
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
            onClick={() => navigate('/')}
            className="mt-4 w-full btn btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8 select-none">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <aside className="lg:col-span-3">
            <div className="card p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Questions
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentIndex + 1}/{questions.length}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isActive = idx === currentIndex;
                  const isAnswered = !!answersById[q.questionId];
                  return (
                    <button
                      key={q.questionId}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-10 rounded-full text-xs font-semibold border transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white border-primary-600'
                          : isAnswered
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500'
                      }`}
                    >
                      Q{idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className="h-full flex flex-col">
              <div className="card p-4 sm:p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Question</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentIndex + 1} of {questions.length}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Time left: <span className="text-primary-600 dark:text-primary-400">{formattedTimeLeft}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <QuestionCard
                  question={current.question}
                  options={current.answers}
                  value={selectedValue}
                  onChange={handleSelect}
                />
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-3 items-center">
                  {!isFirst ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                      className="h-11 w-11 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-500 transition-colors flex items-center justify-center"
                      aria-label="Previous question"
                    >
                      <img src={left} alt="Previous" className="h-5 w-5" />
                    </button>
                  ) : (
                    <div className="h-11 w-11" />
                  )}

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleFinish}
                      className={`btn btn-primary w-full sm:w-1/2 ${
                        isAllAnswered ? '' : 'opacity-50 cursor-not-allowed'
                      }`}
                      disabled={!isAllAnswered}
                    >
                      Finish
                    </button>
                  </div>

                  {!isLast ? (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                        className="h-11 w-11 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-500 transition-colors flex items-center justify-center"
                        aria-label="Next question"
                      >
                        <img src={right} alt="Next" className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-11 w-11" />
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;