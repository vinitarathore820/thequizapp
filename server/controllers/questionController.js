// controllers/questionController.js
const TriviaService = require('../services/triviaService');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all categories
// @route   GET /api/v1/questions/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await TriviaService.getCategories();
  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get question count for a category
// @route   GET /api/v1/questions/count/:categoryId
// @access  Public
exports.getQuestionCount = asyncHandler(async (req, res, next) => {
  const count = await TriviaService.getQuestionCount(req.params.categoryId);
  res.status(200).json({
    success: true,
    data: count
  });
});