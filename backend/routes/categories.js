const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/categories/key/:key
// @desc    Update a category by key
// @access  Public
router.put('/key/:key', async (req, res) => {
  try {
    let category = await Category.findOne({ key: req.params.key });
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    category = await Category.findOneAndUpdate(
      { key: req.params.key },
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;