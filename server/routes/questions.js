const express = require('express');
const {
  getTypes,
  getCategories,
  getQuestionCount,
  getQuestions
} = require('../controllers/questionController');

const router = express.Router();

// Public routes
router.get('/types', getTypes);
router.get('/categories', getCategories);
router.get('/count/:categoryId', getQuestionCount);
router.get('/', getQuestions);

module.exports = router;
