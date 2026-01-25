const express = require('express');
const {
  getTypes,
  createType,
  createTypeWithCategories,
  getCategories,
  createCategory,
  getQuestionCountCombined,
  getQuestionCount,
  getQuestions
} = require('../controllers/questionController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/types', getTypes);
router.post('/types', protect, createType);
router.post('/types-with-categories', protect, createTypeWithCategories);
router.get('/categories', getCategories);
router.post('/categories', protect, createCategory);
router.get('/count', getQuestionCountCombined);
router.get('/count/:categoryId', getQuestionCount);
router.get('/', getQuestions);

module.exports = router;
