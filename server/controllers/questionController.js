// controllers/questionController.js
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Category = require('../models/Category');
const Question = require('../models/Question');
const QuestionType = require('../models/QuestionType');

// @desc    Get all quiz types
// @route   GET /api/v1/questions/types
// @access  Public
exports.getTypes = asyncHandler(async (req, res, next) => {
  const types = await QuestionType.find().sort({ name: 1 }).select('name');
  const data = types.map(t => t.name);

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get categories (optionally filtered by quiz type)
// @route   GET /api/v1/questions/categories?type=...
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const { type } = req.query;

  const filter = {};
  if (type) filter.type = type;

  const categories = await Category.find(filter).sort({ name: 1 }).select('id name type');
  const data = categories.map(c => ({ id: c.id, name: c.name, type: c.type }));

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get question count for a category
// @route   GET /api/v1/questions/count/:categoryId
// @access  Public
exports.getQuestionCount = asyncHandler(async (req, res, next) => {
  const categoryId = Number(req.params.categoryId);
  if (!Number.isFinite(categoryId)) {
    return next(new ErrorResponse('Invalid category id', 400));
  }

  const [easy, medium, hard] = await Promise.all([
    Question.countDocuments({ categoryId, difficulty: 'easy' }),
    Question.countDocuments({ categoryId, difficulty: 'medium' }),
    Question.countDocuments({ categoryId, difficulty: 'hard' })
  ]);

  const count = {
    total_question_count: easy + medium + hard,
    total_easy_question_count: easy,
    total_medium_question_count: medium,
    total_hard_question_count: hard
  };

  res.status(200).json({
    success: true,
    data: count
  });
});

// @desc    Get random questions from DB
// @route   GET /api/v1/questions?categoryId=..&difficulty=..&amount=..
// @access  Public
exports.getQuestions = asyncHandler(async (req, res, next) => {
  const { categoryId, difficulty, amount = 10, quizType } = req.query;

  const parsedCategoryId = Number(categoryId);
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount < 1 || parsedAmount > 50) {
    return next(new ErrorResponse('Amount must be between 1 and 50', 400));
  }

  const match = {};
  if (Number.isFinite(parsedCategoryId)) match.categoryId = parsedCategoryId;
  if (difficulty && difficulty !== 'any') match.difficulty = difficulty;
  if (quizType && quizType !== 'any') match.quizType = quizType;

  const available = await Question.countDocuments(match);
  if (available < parsedAmount) {
    return next(new ErrorResponse('No questions found for the specified criteria', 404));
  }

  const questions = await Question.aggregate([
    { $match: match },
    { $sample: { size: parsedAmount } },
    {
      $project: {
        question: 1,
        categoryId: 1,
        quizType: 1,
        category: 1,
        type: 1,
        difficulty: 1,
        correct_answer: 1,
        incorrect_answers: 1,
        explanation: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});