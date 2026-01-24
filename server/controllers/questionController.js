// controllers/questionController.js
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Category = require('../models/Category');
const Question = require('../models/Question');
const QuestionType = require('../models/QuestionType');
const mongoose = require('mongoose');

// @desc    Get all quiz types
// @route   GET /api/v1/questions/types
// @access  Public
exports.getTypes = asyncHandler(async (req, res, next) => {
  const types = await QuestionType.find().sort({ name: 1 }).select('_id name');

  const typeCounts = await Question.aggregate([
    {
      $group: {
        _id: '$typeId',
        questionCount: { $sum: 1 }
      }
    }
  ]);

  const countByTypeId = new Map(typeCounts.map(r => [String(r._id), r.questionCount]));
  const data = types.map(t => ({
    id: t._id,
    name: t.name,
    questionCount: countByTypeId.get(String(t._id)) || 0
  }));

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
  const { type, typeId } = req.query;

  const filter = {};
  if (typeId) {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      return next(new ErrorResponse('Invalid typeId', 400));
    }
    filter.typeId = typeId;
  } else if (type) {
    filter.type = type;
  }

  const categories = await Category.find(filter).sort({ name: 1 }).select('_id id name type typeId');

  const categoryCounts = await Question.aggregate([
    {
      $match: {
        categoryRef: { $in: categories.map(c => c._id) }
      }
    },
    {
      $group: {
        _id: { categoryRef: '$categoryRef', difficulty: '$difficulty' },
        count: { $sum: 1 }
      }
    }
  ]);

  const countsByCategoryId = new Map();
  for (const row of categoryCounts) {
    const catId = String(row._id.categoryRef);
    const difficulty = row._id.difficulty;
    if (!countsByCategoryId.has(catId)) {
      countsByCategoryId.set(catId, { easy: 0, medium: 0, hard: 0 });
    }
    const obj = countsByCategoryId.get(catId);
    if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
      obj[difficulty] = row.count;
    }
  }

  const data = categories.map(c => {
    const difficultyCounts = countsByCategoryId.get(String(c._id)) || { easy: 0, medium: 0, hard: 0 };
    const questionCount = difficultyCounts.easy + difficultyCounts.medium + difficultyCounts.hard;
    return {
      id: c._id,
      legacyId: c.id,
      name: c.name,
      type: c.type,
      typeId: c.typeId,
      questionCount,
      difficultyCounts
    };
  });

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
  const raw = req.params.categoryId;
  const match = {};
  if (mongoose.Types.ObjectId.isValid(raw)) {
    match.categoryRef = raw;
  } else {
    const categoryId = Number(raw);
    if (!Number.isFinite(categoryId)) {
      return next(new ErrorResponse('Invalid categoryId', 400));
    }
    match.categoryId = categoryId;
  }

  const [easy, medium, hard] = await Promise.all([
    Question.countDocuments({ ...match, difficulty: 'easy' }),
    Question.countDocuments({ ...match, difficulty: 'medium' }),
    Question.countDocuments({ ...match, difficulty: 'hard' })
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

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount < 1 || parsedAmount > 50) {
    return next(new ErrorResponse('Amount must be between 1 and 50', 400));
  }

  const match = {};
  if (categoryId) {
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      match.categoryRef = categoryId;
    } else {
      const parsedCategoryId = Number(categoryId);
      if (!Number.isFinite(parsedCategoryId)) {
        return next(new ErrorResponse('Invalid categoryId', 400));
      }
      match.categoryId = parsedCategoryId;
    }
  }
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