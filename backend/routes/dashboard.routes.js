const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const ProcessingJob = require('../models/ProcessingJob');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', dashboardController.getStats);

// @route   GET /api/dashboard/recent
// @desc    Get recent processing jobs
// @access  Private
router.get('/recent', dashboardController.getRecentJobs);

// @route   GET /api/dashboard/quick-stats
// @desc    Get quick overview stats
// @access  Private
router.get('/quick-stats', dashboardController.getQuickStats);

// Add this route for debugging
router.get('/debug-test', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const mongoose = require('mongoose');
    
    console.log('=== DEBUG TEST START ===');
    console.log('User ID from token:', userId);
    console.log('Type:', typeof userId);
    
    // Test 1: Check if userId is valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    console.log('Is valid ObjectId?', isValidObjectId);
    
    // Test 2: Try different query methods
    const userIdObj = isValidObjectId ? new mongoose.Types.ObjectId(userId) : userId;
    
    // Method A: Direct find with string
    const jobsWithString = await ProcessingJob.find({ userId: userId });
    console.log('Jobs found with string ID:', jobsWithString.length);
    
    // Method B: Direct find with ObjectId
    const jobsWithObjectId = await ProcessingJob.find({ userId: userIdObj });
    console.log('Jobs found with ObjectId:', jobsWithObjectId.length);
    
    // Method C: Count with string
    const countWithString = await ProcessingJob.countDocuments({ userId: userId });
    console.log('Count with string:', countWithString);
    
    // Method D: Count with ObjectId
    const countWithObjectId = await ProcessingJob.countDocuments({ userId: userIdObj });
    console.log('Count with ObjectId:', countWithObjectId);
    
    // Show sample job if exists
    if (jobsWithString.length > 0) {
      console.log('Sample job (string query):', {
        _id: jobsWithString[0]._id,
        userId: jobsWithString[0].userId,
        totalLines: jobsWithString[0].totalLines,
        completedAt: jobsWithString[0].completedAt
      });
    }
    
    // Test 3: Check aggregation with debug
    const aggregationTest = await ProcessingJob.aggregate([
      {
        $match: {
          userId: userIdObj,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalLines: { $sum: '$totalLines' },
          jobCount: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Aggregation test result:', aggregationTest);
    
    // Test 4: Check if any jobs have totalLines > 0
    const jobsWithLines = await ProcessingJob.find({
      userId: userIdObj,
      status: 'completed',
      totalLines: { $gt: 0 }
    });
    
    console.log('Jobs with totalLines > 0:', jobsWithLines.length);
    if (jobsWithLines.length > 0) {
      console.log('Sample line counts:', jobsWithLines.map(j => j.totalLines));
    }
    
    // Test 5: Check date filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const jobsToday = await ProcessingJob.find({
      userId: userIdObj,
      status: 'completed',
      completedAt: { $gte: today }
    });
    
    console.log('Jobs completed today:', jobsToday.length);
    if (jobsToday.length > 0) {
      console.log('Today job dates:', jobsToday.map(j => j.completedAt));
    }
    
    res.json({
      success: true,
      debug: {
        userId,
        isValidObjectId,
        jobsCount: {
          withString: jobsWithString.length,
          withObjectId: jobsWithObjectId.length,
          countString: countWithString,
          countObjectId: countWithObjectId
        },
        aggregationResult: aggregationTest,
        jobsWithLines: jobsWithLines.length,
        jobsToday: jobsToday.length,
        currentTime: new Date().toISOString(),
        todayStart: today.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Debug test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;