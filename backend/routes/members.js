const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

// @route   GET /api/members
// @desc    Get all members
// @access  Public
router.get('/', async (req, res) => {
  try {
    const members = await Member.find().sort({ total: -1 });
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/members
// @desc    Create a member
// @access  Public
router.post('/', async (req, res) => {
  try {
    const newMember = new Member(req.body);
    const member = await newMember.save();
    res.json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/members/:id
// @desc    Update a member
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    let member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ msg: 'Member not found' });
    }
    
    member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Calculate total
    member.total = 
      (member.attendance || 0) +
      (member.gameWin || 0) +
      (member.roundWin || 0) +
      (member.mom || 0) +
      (member.fullAttendance || 0) +
      (member.extra || 0) -
      (member.late || 0) -
      (member.absence || 0);
    
    await member.save();
    
    res.json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/members/:id
// @desc    Delete a member
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ msg: 'Member not found' });
    }
    
    await Member.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Member removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/members/:id/:category
// @desc    Increment or decrement a category value
// @access  Public
router.patch('/:id/:category', async (req, res) => {
  try {
    const { id, category } = req.params;
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({ msg: 'Value is required' });
    }
    
    let member = await Member.findById(id);
    
    if (!member) {
      return res.status(404).json({ msg: 'Member not found' });
    }
    
    // Ensure category exists on member and is a number
    if (typeof member[category] !== 'number') {
      member[category] = 0;
    }
    
    // Update category value
    member[category] += value;
    
    // Ensure non-negative values except for total
    if (category !== 'total' && member[category] < 0) {
      member[category] = 0;
    }
    
    // Recalculate total
    member.total = 
      (member.attendance || 0) +
      (member.gameWin || 0) +
      (member.roundWin || 0) +
      (member.mom || 0) +
      (member.fullAttendance || 0) +
      (member.extra || 0) -
      (member.late || 0) -
      (member.absence || 0);
    
    await member.save();
    
    res.json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/members/bulk
// @desc    Bulk import members
// @access  Public
router.post('/bulk', async (req, res) => {
  try {
    const { members } = req.body;
    
    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ msg: 'Invalid members data' });
    }
    
    // Clear existing members
    await Member.deleteMany({});
    
    // Insert new members
    const savedMembers = await Member.insertMany(members);
    
    res.json(savedMembers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;