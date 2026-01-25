// controllers/quizController.js
const Quiz = require('../models/Quiz');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Category = require('../models/Category');
const Question = require('../models/Question');
const QuestionType = require('../models/QuestionType');
const User = require('../models/User');
const mongoose = require('mongoose');

const QUIZ_QUESTION_COUNT = 15;
const QUIZ_DURATION_SECONDS = 30 * 60;

const getDifficultyMultiplier = (difficulty) => {
  if (difficulty === 'hard') return 2;
  if (difficulty === 'medium') return 1.5;
  return 1;
};

// @desc    Start a new quiz
// @route   POST /api/v1/quizzes/start
// @access  Private
exports.startQuiz = asyncHandler(async (req, res, next) => {
  const { categoryId, category, typeId, difficulty = 'medium', quizType } = req.body;
  const amount = QUIZ_QUESTION_COUNT;

  const rawCategory = categoryId || category;
  if (!rawCategory) {
    throw new ErrorResponse('categoryId is required', 400);
  }

  const isMongoCategoryId = mongoose.Types.ObjectId.isValid(rawCategory);
  const categoryDoc = isMongoCategoryId
    ? await Category.findById(rawCategory)
    : await Category.findOne({ id: Number(rawCategory) });

  if (!categoryDoc) {
    throw new ErrorResponse('Category not found', 404);
  }

  if (quizType && quizType !== categoryDoc.type) {
    throw new ErrorResponse('Category does not belong to the selected type', 400);
  }

  if (typeId) {
    if (!mongoose.Types.ObjectId.isValid(typeId)) {
      throw new ErrorResponse('Invalid typeId', 400);
    }
    if (String(categoryDoc.typeId) !== String(typeId)) {
      throw new ErrorResponse('Category does not belong to the selected type', 400);
    }
  }

  const match = isMongoCategoryId
    ? { categoryRef: categoryDoc._id }
    : { categoryId: categoryDoc.id };
  if (difficulty && difficulty !== 'any') match.difficulty = difficulty;

  const available = await Question.countDocuments(match);
  if (available < Number(amount)) {
    throw new ErrorResponse('No questions found for the specified criteria', 404);
  }

  const questions = await Question.aggregate([
    { $match: match },
    { $sample: { size: Number(amount) } },
    {
      $project: {
        question: 1,
        category: 1,
        type: 1,
        difficulty: 1,
        correct_answer: 1,
        incorrect_answers: 1
      }
    }
  ]);

  const transformedQuestions = questions.map(q => ({
    questionId: q._id,
    question: q.question,
    category: q.category,
    type: q.type,
    difficulty: q.difficulty,
    correct_answer: q.correct_answer,
    incorrect_answers: q.incorrect_answers
  }));

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + QUIZ_DURATION_SECONDS * 1000);

  const quiz = await Quiz.create({
    user: req.user.id,
    questions: transformedQuestions,
    total_questions: questions.length,
    durationSeconds: QUIZ_DURATION_SECONDS,
    startedAt,
    expiresAt,
    categoryId: categoryDoc.id,
    categoryRef: categoryDoc._id,
    category: categoryDoc.name,
    quizType: categoryDoc.type,
    typeId: categoryDoc.typeId,
    difficulty
  });

  const questionsForUser = quiz.questions.map(q => {
    const { correct_answer, ...questionWithoutAnswer } = q.toObject();
    return {
      ...questionWithoutAnswer,
      answers: [...q.incorrect_answers, q.correct_answer]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
    };
  });

  res.status(201).json({
    success: true,
    quizId: quiz._id,
    startedAt: quiz.startedAt,
    expiresAt: quiz.expiresAt,
    durationSeconds: quiz.durationSeconds,
    serverTime: new Date(),
    questions: questionsForUser
  });
});

// @desc    Submit quiz answers
// @route   POST /api/v1/quizzes/:id/submit
// @access  Private
exports.submitQuiz = asyncHandler(async (req, res, next) => {
  const { answers } = req.body;
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  if (quiz.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this quiz', 401));
  }

  if (quiz.completed) {
    return next(new ErrorResponse('This quiz has already been submitted', 400));
  }

  if (!Array.isArray(answers)) {
    return next(new ErrorResponse('answers must be an array', 400));
  }

  const isObjectAnswerFormat = answers.length > 0 && typeof answers[0] === 'object' && answers[0] !== null;
  const answerByQuestionId = new Map();
  if (isObjectAnswerFormat) {
    for (const item of answers) {
      if (!item || !item.questionId) continue;
      answerByQuestionId.set(String(item.questionId), item.answer);
    }
  }

  const now = new Date();
  const isExpired = quiz.expiresAt && now > quiz.expiresAt;

  let score = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let skipped = 0;

  const results = quiz.questions.map((question, index) => {
    const userAnswer = isObjectAnswerFormat
      ? (answerByQuestionId.get(String(question.questionId)) ?? null)
      : (answers[index] ?? null);

    if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
      skipped += 1;
    }

    const isCorrect = userAnswer != null && question.correct_answer === userAnswer;
    if (isCorrect) {
      score += 1;
      correctAnswers += 1;
    } else if (userAnswer != null && userAnswer !== '') {
      incorrectAnswers += 1;
    }

    question.user_answer = userAnswer ?? null;
    question.is_correct = userAnswer == null || userAnswer === '' ? null : isCorrect;

    return {
      questionId: question.questionId,
      question: question.question,
      correctAnswer: question.correct_answer,
      userAnswer: userAnswer ?? null,
      isCorrect
    };
  });

  const percentage = quiz.total_questions > 0
    ? Math.round((score / quiz.total_questions) * 100)
    : 0;

  const pointsEarned = Math.round(score * 10 * getDifficultyMultiplier(quiz.difficulty));

  quiz.score = score;
  quiz.pointsEarned = pointsEarned;
  quiz.completed = true;
  quiz.completedAt = now;
  quiz.status = isExpired ? 'expired' : 'completed';
  await quiz.save();

  await User.findByIdAndUpdate(
    req.user.id,
    { $inc: { points: pointsEarned } },
    { new: false }
  );

  res.status(200).json({
    success: true,
    quizId: quiz._id,
    score,
    total: quiz.total_questions,
    percentage,
    correctAnswers,
    incorrectAnswers,
    skipped,
    status: quiz.status,
    pointsEarned,
    results
  });
});

// @desc    Get user's quiz history
// @route   GET /api/v1/quizzes
// @access  Private
exports.getUserQuizzes = asyncHandler(async (req, res, next) => {
  const quizzes = await Quiz.find({ user: req.user.id })
    .sort('-completedAt -created_at')
    .select('-questions.correct_answer -questions.incorrect_answers');

  const data = quizzes.map(q => {
    const obj = q.toObject();
    return {
      ...obj,
      totalQuestions: obj.total_questions,
      completedAt: obj.completedAt || null
    };
  });

  res.status(200).json({
    success: true,
    count: data.length,
    data
  });
});

// @desc    Get single quiz
// @route   GET /api/v1/quizzes/:id
// @access  Private
exports.getQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  if (quiz.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this quiz', 401));
  }

  if (!quiz.completed) {
    quiz.questions = quiz.questions.map(q => {
      const { correct_answer, ...question } = q.toObject();
      return question;
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...quiz.toObject(),
      totalQuestions: quiz.total_questions
    }
  });
});