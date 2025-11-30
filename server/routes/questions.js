const express = require('express');
const {
  getCategories,
  getQuestionCount
} = require('../controllers/questionController');

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/count/:categoryId', getQuestionCount);

module.exports = router;
