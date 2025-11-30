// controllers/quizController.js
const TriviaService = require('../services/triviaService');
const Quiz = require('../models/Quiz');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Start a new quiz
// @route   POST /api/v1/quizzes/start
// @access  Private
exports.startQuiz = asyncHandler(async (req, res, next) => {
  const { category, difficulty = 'medium', amount = 10 } = req.body;
  
  if (amount > 50) {
    throw new ErrorResponse('Maximum 50 questions allowed per request', 400);
  }

  const questions = await TriviaService.getQuestions({
    amount,
    category,
    difficulty
  });

  const transformedQuestions = questions.map(q => ({
    question: q.question,
    category: q.category,
    type: q.type,
    difficulty: q.difficulty,
    correct_answer: q.correct_answer,
    incorrect_answers: q.incorrect_answers
  }));

  const quiz = await Quiz.create({
    user: req.user.id,
    questions: transformedQuestions,
    total_questions: questions.length,
    category,
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

  let score = 0;
  const results = quiz.questions.map((question, index) => {
    const userAnswer = answers[index];
    const isCorrect = question.correct_answer === userAnswer;
    if (isCorrect) score++;
    
    return {
      question: question.question,
      correctAnswer: question.correct_answer,
      userAnswer,
      isCorrect
    };
  });

  quiz.score = score;
  quiz.completed = true;
  await quiz.save();

  res.status(200).json({
    success: true,
    score,
    total: quiz.total_questions,
    percentage: Math.round((score / quiz.total_questions) * 100),
    results
  });
});

// @desc    Get user's quiz history
// @route   GET /api/v1/quizzes
// @access  Private
exports.getUserQuizzes = asyncHandler(async (req, res, next) => {
  const quizzes = await Quiz.find({ user: req.user.id })
    .sort('-createdAt')
    .select('-questions.correct_answer -questions.incorrect_answers');

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes
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
    data: quiz
  });
});