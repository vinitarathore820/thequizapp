// src/services/quizService.js
import api from './api';

// Start a new quiz
export const startQuiz = async (quizData) => {
  const response = await api.post('/quizzes/start', quizData);
  return response.data;
};

// Get quiz by ID
export const getQuiz = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}`);
  return response.data;
};

// Submit quiz answers
export const submitQuiz = async (quizId, answers) => {
  const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
  return response.data;
};

// Get user's quiz history
export const getQuizHistory = async () => {
  const response = await api.get('/quizzes/history');
  return response.data;
};

// Get quiz categories
export const getCategories = async () => {
  const response = await api.get('/questions/categories');
  return response.data;
};

// Get question count by category
export const getQuestionCount = async (categoryId) => {
  const response = await api.get(`/questions/count/${categoryId}`);
  return response.data;
};

export const getQuizQuestions = async ({ category, categoryId, difficulty, amount = 10, quizType } = {}) => {
  try {
    const response = await api.get('/questions', {
      params: {
        categoryId: categoryId ?? category,
        difficulty,
        amount,
        quizType
      },
    });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    throw error;
  }
};

// Get quiz result by ID
export const getQuizResult = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/result/${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz result:', error);
    throw error;
  }
};

// Get user's quiz statistics
export const getQuizStats = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz statistics:', error);
    throw error;
  }
};