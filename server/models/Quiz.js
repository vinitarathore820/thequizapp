const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  question: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['multiple', 'boolean'], default: 'multiple' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  correct_answer: { type: String, required: true },
  incorrect_answers: [{ type: String }],
  user_answer: { type: String, default: null },
  is_correct: { type: Boolean, default: null }
});

const quizSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  questions: [questionSchema],
  score: { 
    type: Number, 
    default: 0 
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  total_questions: {
    type: Number,
    required: true
  },
  durationSeconds: {
    type: Number,
    default: 30 * 60
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function () {
      const startedAt = this.startedAt instanceof Date ? this.startedAt : new Date();
      const durationSeconds = typeof this.durationSeconds === 'number' ? this.durationSeconds : 30 * 60;
      return new Date(startedAt.getTime() + durationSeconds * 1000);
    }
  },
  completedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'expired'],
    default: 'started'
  },
  categoryId: {
    type: Number
  },
  categoryRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  category: {
    type: String,
    required: true
  },
  quizType: {
    type: String
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionType'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

// Calculate score before saving
quizSchema.pre('save', function(next) {
  if (this.isModified('questions') && this.completed) {
    this.score = this.questions.reduce((score, question) => {
      return score + (question.is_correct ? 1 : 0);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);
