const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  attendance: {
    type: Number,
    default: 0
  },
  gameWin: {
    type: Number,
    default: 0
  },
  roundWin: {
    type: Number,
    default: 0
  },
  mom: {
    type: Number,
    default: 0
  },
  fullAttendance: {
    type: Number,
    default: 0
  },
  extra: {
    type: Number,
    default: 0
  },
  late: {
    type: Number,
    default: 0
  },
  absence: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 저장 전에 합계 자동 계산
MemberSchema.pre('save', function(next) {
  this.total = 
    (this.attendance || 0) +
    (this.gameWin || 0) +
    (this.roundWin || 0) +
    (this.mom || 0) +
    (this.fullAttendance || 0) +
    (this.extra || 0) -
    (this.late || 0) -
    (this.absence || 0);
  next();
});

module.exports = mongoose.model('Member', MemberSchema);