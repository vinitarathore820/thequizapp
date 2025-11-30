// routes/quiz.js
const express = require('express');
const {
  startQuiz,
  submitQuiz,
  getUserQuizzes,
  getQuiz
} = require('../controllers/quizController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes below this middleware will be protected
router.use(protect);

// Quiz routes
router.post('/start', startQuiz);
router.post('/:id/submit', submitQuiz);
router.get('/', getUserQuizzes);
router.get('/:id', getQuiz);

module.exports = router;