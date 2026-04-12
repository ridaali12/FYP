const express = require('express');
const router = express.Router();
const Wildlife = require('../models/Wildlife');

// GET all wildlife facts
router.get('/', async (req, res) => {
  try {
    const wildlife = await Wildlife.find().sort({ createdAt: -1 });
    res.json(wildlife);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single wildlife fact by ID
router.get('/:id', async (req, res) => {
  try {
    const wildlife = await Wildlife.findById(req.params.id);
    if (!wildlife) {
      return res.status(404).json({ message: 'Wildlife fact not found' });
    }
    res.json(wildlife);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new wildlife fact
router.post('/', async (req, res) => {
  try {
    const wildlife = new Wildlife(req.body);
    const savedWildlife = await wildlife.save();
    res.status(201).json(savedWildlife);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE wildlife fact
router.delete('/:id', async (req, res) => {
  try {
    const wildlife = await Wildlife.findByIdAndDelete(req.params.id);
    if (!wildlife) {
      return res.status(404).json({ message: 'Wildlife fact not found' });
    }
    res.json({ message: 'Wildlife fact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
