const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  label: {
    type: String,
    required: true
  },
  increment: {
    type: Number,
    default: 1
  },
  decrement: {
    type: Number,
    default: 1
  },
  isNegative: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema);