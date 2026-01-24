const mongoose = require('mongoose');

const questionTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a type name'],
    trim: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuestionType', questionTypeSchema);
