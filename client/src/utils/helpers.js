// src/utils/helpers.js
export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateScore = (quiz) => {
  if (!quiz) return { score: 0, percentage: 0 };
  const percentage = Math.round((quiz.correctAnswers / quiz.totalQuestions) * 100);
  return {
    score: `${quiz.correctAnswers}/${quiz.totalQuestions}`,
    percentage,
  };
};