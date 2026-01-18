const { logger } = require('../utils/logger');
const ProcessingJob = require('../models/ProcessingJob');

/**
 * Get dashboard statistics - WITH MONGODB
 */
const getStats = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // CRITICAL: Convert string userId to ObjectId
    const mongoose = require('mongoose');
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    //console.log('=== DASHBOARD STATS ===');
    //console.log('User ID (string):', userId);
    //console.log('User ID (ObjectId):', userIdObj);
    
    // Get dates in UTC
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    //console.log('Today (UTC start):', today.toISOString());
    //console.log('Current time:', now.toISOString());
    
    // This week start (Monday) in UTC
    const thisWeek = new Date(today);
    const dayOfWeek = today.getUTCDay();
    thisWeek.setUTCDate(today.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // This month start in UTC
    const thisMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    
    // Fetch statistics - USING ObjectId (userIdObj) NOT string (userId)
    const [
      totalJobs,
      completedJobs,
      totalLinesResult,
      todayStats,
      weekStats,
      monthStats,
      sentimentAggregation
    ] = await Promise.all([
      // Total jobs - USE ObjectId
      ProcessingJob.countDocuments({ userId: userIdObj }),
      
      // Completed jobs - USE ObjectId
      ProcessingJob.countDocuments({ userId: userIdObj, status: 'completed' }),
      
      // Total lines analyzed - USE ObjectId, remove totalLines filter
      ProcessingJob.aggregate([
        { $match: { userId: userIdObj, status: 'completed' } },
        { $group: { _id: null, totalLines: { $sum: { $ifNull: ['$totalLines', 0] } } } }
      ]),
      
      // Today's stats - USE ObjectId
      ProcessingJob.aggregate([
        { $match: { userId: userIdObj, status: 'completed', completedAt: { $gte: today } } },
        { $group: { 
          _id: null, 
          filesProcessed: { $sum: 1 }, 
          totalLines: { $sum: { $ifNull: ['$totalLines', 0] } },
          avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
        } }
      ]),
      
      // This week's stats - USE ObjectId
      ProcessingJob.aggregate([
        { $match: { userId: userIdObj, status: 'completed', completedAt: { $gte: thisWeek } } },
        { $group: { 
          _id: null, 
          filesProcessed: { $sum: 1 }, 
          totalLines: { $sum: { $ifNull: ['$totalLines', 0] } },
          avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
        } }
      ]),
      
      // This month's stats - USE ObjectId
      ProcessingJob.aggregate([
        { $match: { userId: userIdObj, status: 'completed', completedAt: { $gte: thisMonth } } },
        { $group: { 
          _id: null, 
          filesProcessed: { $sum: 1 }, 
          totalLines: { $sum: { $ifNull: ['$totalLines', 0] } },
          avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
        } }
      ]),
      
      // Sentiment distribution - USE ObjectId
      ProcessingJob.aggregate([
        { $match: { userId: userIdObj, status: 'completed', sentimentDistribution: { $exists: true } } },
        { $sort: { completedAt: -1 } },
        { $limit: 20 },
        { $group: { 
          _id: null, 
          totalPositive: { $sum: { $ifNull: ['$sentimentDistribution.positive', 0] } },
          totalNeutral: { $sum: { $ifNull: ['$sentimentDistribution.neutral', 0] } },
          totalNegative: { $sum: { $ifNull: ['$sentimentDistribution.negative', 0] } }
        } }
      ])
    ]);
    
    //console.log('Results:');
    //console.log('- totalLinesResult:', totalLinesResult);
    //console.log('- sentimentAggregation:', sentimentAggregation);
    
    // Calculate success rate
    const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
    
    // Calculate sentiment distribution
    let sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
    if (sentimentAggregation.length > 0 && sentimentAggregation[0]) {
      const { totalPositive, totalNeutral, totalNegative } = sentimentAggregation[0];
      const totalAll = totalPositive + totalNeutral + totalNegative;
      
      //console.log('Sentiment totals:', { totalPositive, totalNeutral, totalNegative, totalAll });
      
      if (totalAll > 0) {
        sentimentDistribution = {
          positive: Math.round((totalPositive / totalAll) * 100),
          neutral: Math.round((totalNeutral / totalAll) * 100),
          negative: Math.round((totalNegative / totalAll) * 100)
        };
      }
    }
    
    // Calculate average sentiment from all jobs
    const allJobs = await ProcessingJob.find({ 
      userId: userIdObj, 
      status: 'completed',
      averageSentiment: { $exists: true, $ne: null }
    });
    
    const avgSentimentOverall = allJobs.length > 0 
      ? allJobs.reduce((sum, job) => sum + job.averageSentiment, 0) / allJobs.length
      : 0;
    
    // Prepare response
    const stats = {
      totalFilesProcessed: totalJobs,
      totalLinesAnalyzed: totalLinesResult[0]?.totalLines || 0,
      averageProcessingTime: 0,
      successRate,
      storageUsed: 0,
      sentimentDistribution,
      averageSentiment: parseFloat(avgSentimentOverall.toFixed(2))
    };
    
    // Add quick stats
    const quickStats = {
      today: {
        filesProcessed: todayStats[0]?.filesProcessed || 0,
        linesAnalyzed: todayStats[0]?.totalLines || 0,
        avgSentiment: todayStats[0]?.avgSentiment ? parseFloat(todayStats[0].avgSentiment.toFixed(2)) : 0
      },
      thisWeek: {
        filesProcessed: weekStats[0]?.filesProcessed || 0,
        linesAnalyzed: weekStats[0]?.totalLines || 0,
        avgSentiment: weekStats[0]?.avgSentiment ? parseFloat(weekStats[0].avgSentiment.toFixed(2)) : 0
      },
      thisMonth: {
        filesProcessed: monthStats[0]?.filesProcessed || 0,
        linesAnalyzed: monthStats[0]?.totalLines || 0,
        avgSentiment: monthStats[0]?.avgSentiment ? parseFloat(monthStats[0].avgSentiment.toFixed(2)) : 0
      }
    };
    
    //console.log('Final stats to send:', stats);
    
    res.json({
      success: true,
      data: {
        ...stats,
        quickStats
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

/**
 * Get recent processing jobs - WITH MONGODB
 */
const getRecentJobs = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 10 } = req.query;
    
    // Fetch recent jobs from MongoDB
    const recentJobs = await ProcessingJob.find({ userId })
      .select('filename originalFilename status totalLines averageSentiment processingTimeMs createdAt startedAt completedAt failedAt errorMessage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean(); // Convert to plain objects for faster response
    
    // Format jobs for frontend
    const formattedJobs = recentJobs.map(job => ({
      id: job._id,
      filename: job.originalFilename,
      status: job.status,
      processedAt: job.completedAt || job.createdAt,
      lines: job.totalLines || 0,
      sentimentScore: job.averageSentiment,
      processingTime: job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) : null,
      error: job.errorMessage
    }));
    
    res.json({
      success: true,
      data: {
        jobs: formattedJobs,
        count: formattedJobs.length
      }
    });
  } catch (error) {
    logger.error('Recent jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent jobs'
    });
  }
};

/**
 * Get quick overview stats - WITH MONGODB
 */
const getQuickStats = async (req, res) => {
  try {
    const { userId } = req.user;

    const mongoose = require('mongoose');
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId)
      : userId;
    
    //console.log('=== QUICK STATS DEBUG START ===');
    //console.log('User ID:', userId);
    //console.log('User ID (ObjectId):', userIdObj);
    
    // Get current time
    const now = new Date();
    //console.log('Current server time:', now.toISOString());
    
    // TODAY: Start of today in UTC
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    //console.log('Today start (UTC):', today.toISOString());
    
    // YESTERDAY: Start of yesterday in UTC
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    //console.log('Yesterday start (UTC):', yesterday.toISOString());
    
    // THIS WEEK: Monday of this week in UTC
    const thisWeek = new Date(today);
    const dayOfWeek = today.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    thisWeek.setUTCDate(today.getUTCDate() - daysSinceMonday);
    //console.log('This week start (Monday UTC):', thisWeek.toISOString());
    
    // LAST WEEK: Monday of last week in UTC
    const lastWeek = new Date(thisWeek);
    lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
    //console.log('Last week start (Monday UTC):', lastWeek.toISOString());
    
    // THIS MONTH: 1st day of this month in UTC
    const thisMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    //console.log('This month start (UTC):', thisMonth.toISOString());
    
    // LAST MONTH: 1st day of last month in UTC
    const lastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    //console.log('Last month start (UTC):', lastMonth.toISOString());
    
    // DEBUG: Check what jobs exist
    const sampleJobs = await ProcessingJob.find({
      userId: userIdObj,
      status: 'completed'
    }).limit(3).select('completedAt totalLines averageSentiment');
    
    //console.log('Sample user jobs:', sampleJobs.length);
    sampleJobs.forEach((job, i) => {
      //console.log(`Job ${i}:`);
      //console.log(`  completedAt: ${job.completedAt.toISOString()}`);
      //console.log(`  totalLines: ${job.totalLines}`);
      //console.log(`  Is >= today? ${job.completedAt >= today}`);
      //console.log(`  Is >= thisWeek? ${job.completedAt >= thisWeek}`);
      //console.log(`  Is >= thisMonth? ${job.completedAt >= thisMonth}`);
    });
    
    // Fetch all stats in parallel
    const [
      todayStats,
      yesterdayStats,
      thisWeekStats,
      lastWeekStats,
      thisMonthStats,
      lastMonthStats
    ] = await Promise.all([
      // Today's stats
      ProcessingJob.aggregate([
        {
          $match: {
            userId: userIdObj,
            status: 'completed',
            completedAt: { $gte: today }
          }
        },
        {
          $group: {
            _id: null,
            filesProcessed: { $sum: 1 },
            linesAnalyzed: { $sum: { $ifNull: ['$totalLines', 0] } },
            avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
          }
        }
      ]),
      
      // Yesterday's stats
      ProcessingJob.aggregate([
        {
          $match: {
            userId: userIdObj,
            status: 'completed',
            completedAt: { $gte: yesterday, $lt: today }
          }
        },
        {
          $group: {
            _id: null,
            filesProcessed: { $sum: 1 },
            linesAnalyzed: { $sum: { $ifNull: ['$totalLines', 0] } },
            avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
          }
        }
      ]),
      
      // This Week's stats
      ProcessingJob.aggregate([
        {
          $match: {
            userId: userIdObj,
            status: 'completed',
            completedAt: { $gte: thisWeek }
          }
        },
        {
          $group: {
            _id: null,
            filesProcessed: { $sum: 1 },
            linesAnalyzed: { $sum: { $ifNull: ['$totalLines', 0] } },
            avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
          }
        }
      ]),
      
      // Last Week's stats
      ProcessingJob.aggregate([
        {
          $match: {
            userId: userIdObj,
            status: 'completed',
            completedAt: { $gte: lastWeek, $lt: thisWeek }
          }
        },
        {
          $group: {
            _id: null,
            filesProcessed: { $sum: 1 },
            linesAnalyzed: { $sum: { $ifNull: ['$totalLines', 0] } },
            avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
          }
        }
      ]),
      
      // This Month's stats
      ProcessingJob.aggregate([
        {
          $match: {
            userId: userIdObj,
            status: 'completed',
            completedAt: { $gte: thisMonth }
          }
        },
        {
          $group: {
            _id: null,
            filesProcessed: { $sum: 1 },
            linesAnalyzed: { $sum: { $ifNull: ['$totalLines', 0] } },
            avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
          }
        }
      ]),
      
      // Last Month's stats
      ProcessingJob.aggregate([
        {
          $match: {
            userId: userIdObj,
            status: 'completed',
            completedAt: { $gte: lastMonth, $lt: thisMonth }
          }
        },
        {
          $group: {
            _id: null,
            filesProcessed: { $sum: 1 },
            linesAnalyzed: { $sum: { $ifNull: ['$totalLines', 0] } },
            avgSentiment: { $avg: { $ifNull: ['$averageSentiment', 0] } }
          }
        }
      ])
    ]);
    
    //console.log('=== AGGREGATION RESULTS ===');
    //console.log('todayStats:', todayStats);
    //console.log('yesterdayStats:', yesterdayStats);
    //console.log('thisWeekStats:', thisWeekStats);
    //console.log('lastWeekStats:', lastWeekStats);
    //console.log('thisMonthStats:', thisMonthStats);
    //console.log('lastMonthStats:', lastMonthStats);
    
    // Calculate percentage change
    const calculateChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - previous) / previous) * 100);
    };
    
    // Format response
    const quickStats = {
      today: {
        filesProcessed: todayStats[0]?.filesProcessed || 0,
        linesAnalyzed: todayStats[0]?.linesAnalyzed || 0,
        avgSentiment: todayStats[0]?.avgSentiment ? parseFloat(todayStats[0].avgSentiment.toFixed(2)) : 0,
        changeFromYesterday: calculateChange(
          todayStats[0]?.filesProcessed || 0,
          yesterdayStats[0]?.filesProcessed || 0
        )
      },
      thisWeek: {
        filesProcessed: thisWeekStats[0]?.filesProcessed || 0,
        linesAnalyzed: thisWeekStats[0]?.linesAnalyzed || 0,
        avgSentiment: thisWeekStats[0]?.avgSentiment ? parseFloat(thisWeekStats[0].avgSentiment.toFixed(2)) : 0,
        changeFromLastWeek: calculateChange(
          thisWeekStats[0]?.filesProcessed || 0,
          lastWeekStats[0]?.filesProcessed || 0
        )
      },
      thisMonth: {
        filesProcessed: thisMonthStats[0]?.filesProcessed || 0,
        linesAnalyzed: thisMonthStats[0]?.linesAnalyzed || 0,
        avgSentiment: thisMonthStats[0]?.avgSentiment ? parseFloat(thisMonthStats[0].avgSentiment.toFixed(2)) : 0,
        changeFromLastMonth: calculateChange(
          thisMonthStats[0]?.filesProcessed || 0,
          lastMonthStats[0]?.filesProcessed || 0
        )
      }
    };
    
    //console.log('=== FINAL QUICKSTATS ===');
    //console.log(JSON.stringify(quickStats, null, 2));
    
    res.json({
      success: true,
      data: quickStats
    });
    
  } catch (error) {
    console.error('Quick stats error:', error);
    logger.error('Quick stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick statistics'
    });
  }
};
/**
 * Helper function to calculate percentage change
 */
const calculateChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

module.exports = {
  getStats,
  getRecentJobs,
  getQuickStats
};