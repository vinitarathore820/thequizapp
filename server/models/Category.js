const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionType',
    required: true
  },
  type: {
    type: String,
    required: [true, 'Please add a type'],
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

categorySchema.index({ type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
