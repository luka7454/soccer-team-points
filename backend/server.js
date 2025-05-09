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

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/members', memberRoutes);
app.use('/api/categories', categoryRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../', 'frontend', 'build', 'index.html'));
  });
}

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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