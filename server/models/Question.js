const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { 
    type: String, 
    required: [true, 'Please add a question'],
    trim: true,
    maxlength: [500, 'Question cannot be more than 500 characters']
  },
  category: { 
    type: String, 
    required: [true, 'Please add a category']
  },
  type: { 
    type: String, 
    enum: ['multiple', 'boolean'], 
    default: 'multiple' 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    required: [true, 'Please add difficulty level']
  },
  correct_answer: { 
    type: String, 
    required: [true, 'Please add the correct answer']
  },
  incorrect_answers: [{ 
    type: String,
    required: [
      function() {
        return this.type === 'multiple';
      },
      'Incorrect answers are required for multiple choice questions'
    ]
  }],
  explanation: {
    type: String,
    maxlength: [1000, 'Explanation cannot be more than 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create text index for searching
questionSchema.index({ question: 'text', category: 'text' });

module.exports = mongoose.model('Question', questionSchema);
