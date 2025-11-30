// src/pages/QuizPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import { getQuizQuestions } from '../services/quizService';

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question

  const { category, difficulty, amount } = location.state || {};

  // Fetch quiz questions
  const { data: questions = [], isLoading, error } = useQuery({
    queryKey: ['quiz', category, difficulty, amount],
    queryFn: () => getQuizQuestions({ category, difficulty, amount }),
    enabled: !!category && !!difficulty && !!amount,
  });

  // Timer effect
  useEffect(() => {
    if (!questions.length || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 60; // Reset timer for next question
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, questions.length, showResult]);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    // Check if answer is correct
    if (selectedAnswer === currentQuestion?.correct_answer) {
      setScore((prev) => prev + 1);
    }

    // Move to next question or show results
    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(60); // Reset timer for next question
    }
  };

  const handleFinishQuiz = () => {
    navigate('/quiz/result', {
      state: {
        score,
        total: questions.length,
        category,
        difficulty,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="alert alert-error">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Error loading questions. Please try again.</span>
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

  if (showResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quiz Complete!</h2>
          <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-6">
            {score} / {questions.length}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {score === questions.length
              ? 'Perfect! You got all questions right!'
              : score > questions.length / 2
              ? 'Good job! You passed the quiz!'
              : 'Keep practicing to improve your score!'}
          </p>
          <div className="space-y-4">
            <button
              onClick={handleFinishQuiz}
              className="w-full btn btn-primary py-3"
            >
              View Detailed Results
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full btn btn-outline py-3"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  // Decode HTML entities in question and answers
  const decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const question = decodeHTML(currentQuestion.question);
  const answers = [
    ...currentQuestion.incorrect_answers.map((a) => decodeHTML(a)),
    decodeHTML(currentQuestion.correct_answer),
  ].sort(() => Math.random() - 0.5); // Shuffle answers

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Time left: <span className="text-primary-600 dark:text-primary-400">{timeLeft}s</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-primary-500 h-2.5 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="card p-6 mb-8">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-6">
            {question}
          </h3>

          <div className="space-y-3">
            {answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(answer)}
                className={`w-full text-left p-4 rounded-lg border ${
                  selectedAnswer === answer
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-500'
                } transition-colors`}
              >
                <div className="flex items-center">
                  <div
                    className={`flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${
                      selectedAnswer === answer
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-gray-400 dark:border-gray-500'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-gray-800 dark:text-gray-200">{answer}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex((prev) => prev - 1);
                setSelectedAnswer(null);
                setTimeLeft(60);
              }
            }}
            disabled={currentQuestionIndex === 0}
            className="btn btn-outline"
          >
            Previous
          </button>
          <button
            onClick={isLastQuestion ? handleFinishQuiz : handleNextQuestion}
            disabled={!selectedAnswer}
            className="btn btn-primary"
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;