const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Import routes
const memberRoutes = require('./routes/members');
const categoryRoutes = require('./routes/categories');

// Initialize app
const app = express();

// 수정된 CORS 설정 - 모든 출처 허용
app.use(cors({
  origin: '*',  // 모든 도메인에서의 요청 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// 추가된 테스트 엔드포인트 
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Mount routes
app.use('/api/members', memberRoutes);
app.use('/api/categories', categoryRoutes);

// 정적 파일 서빙 부분 수정
// 별도로 배포된 프론트엔드를 사용하므로 이 부분 주석 처리
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../frontend/build')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, '../', 'frontend', 'build', 'index.html'));
//   });
// }

// API 경로가 아닌 모든 요청에 대해 404 응답
app.use('*', (req, res, next) => {
  if (!req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

// Connect to database with increased timeout
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 타임아웃 30초로 증가
  connectTimeoutMS: 30000
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Initialize default categories if none exist
const Category = require('./models/Category');
const initializeCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        { key: 'attendance', label: '출석(+3)', increment: 3, decrement: 3 },
        { key: 'gameWin', label: '경기승리수당 (+3)', increment: 3, decrement: 3 },
        { key: 'roundWin', label: '라운드 최종 승리수당(+5)', increment: 5, decrement: 5 },
        { key: 'mom', label: 'MOM(+2)', increment: 2, decrement: 2 },
        { key: 'fullAttendance', label: '만근(+5)', increment: 5, decrement: 5 },
        { key: 'extra', label: '추가항목', increment: 1, decrement: 1 },
        { key: 'late', label: '지각(-3)', increment: 3, decrement: 3, isNegative: true },
        { key: 'absence', label: '무단결석(-10)', increment: 10, decrement: 10, isNegative: true }
      ];
      await Category.insertMany(defaultCategories);
      console.log('Default categories initialized');
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initializeCategories();
});
