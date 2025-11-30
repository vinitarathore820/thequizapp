const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
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
  total_questions: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
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
