const { logger } = require('../utils/logger');
const ProcessingJob = require('../models/ProcessingJob');

// Helper to build query
const buildSearchQuery = (userId, searchTerm) => {
  const query = { userId };
  if (searchTerm && searchTerm.trim()) {
    const safeSearch = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { originalFilename: { $regex: safeSearch, $options: 'i' } },
      { textContent: { $regex: safeSearch, $options: 'i' } }
    ];
  }
  return query;
};

/**
 * Get user's processing history
 */
const getHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10, status, startDate, endDate, search } = req.query;
    
    // Build query
    const query = { userId };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Search by filename
    if (search && search.trim()) {
      query.originalFilename = { $regex: search, $options: 'i' };
    }
    
    // Get total count for pagination
    const total = await ProcessingJob.countDocuments(query);
    
    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get paginated results
    const jobs = await ProcessingJob.find(query)
      .select('filename originalFilename status totalLines averageSentiment processingTimeMs createdAt startedAt completedAt failedAt errorMessage fileSize')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Format response
    const formattedJobs = jobs.map(job => ({
      id: job._id,
      jobId: job._id,
      filename: job.originalFilename,
      status: job.status,
      processedAt: job.completedAt || job.createdAt,
      linesProcessed: job.totalLines || 0,
      sentimentScore: job.averageSentiment,
      processingTime: job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) : null,
      fileSize: job.fileSize ? `${(job.fileSize / (1024*1024)).toFixed(1)} MB` : 'N/A',
      error: job.errorMessage
    }));
    
    res.json({
      success: true,
      data: {
        history: formattedJobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + jobs.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('History fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history'
    });
  }
};

/**
 * Get specific history record by job ID
 */
const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    // Find the job
    const job = await ProcessingJob.findOne({
      _id: id,
      userId
    }).select('filename originalFilename status totalLines averageSentiment processingTimeMs createdAt startedAt completedAt failedAt errorMessage fileSize results sentimentDistribution');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'History record not found'
      });
    }
    
    // Calculate detailed results
    let detailedResults = null;
    if (job.results && job.results.length > 0) {
      // Get top keywords from all results
      const allKeywords = job.results.flatMap(result => result.keywords || []);
      const keywordCounts = {};
      allKeywords.forEach(keyword => {
        if (keyword && keyword.trim()) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      });
      
      // Get top 5 keywords
      const topKeywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
      
      // Get patterns found
      const allPatterns = [...new Set(job.results.flatMap(result => result.patternsFound || []))];
      
      detailedResults = {
        sentimentBreakdown: job.sentimentDistribution || { positive: 0, neutral: 0, negative: 0 },
        topKeywords,
        patternsFound: allPatterns,
        processingStats: {
          parallelWorkers: job.results[0]?.metadata?.processId ? 'Python ML Workers' : 'Simulation',
          totalResults: job.results.length,
          processingTime: job.processingTimeMs ? `${(job.processingTimeMs / 1000).toFixed(2)}s` : 'N/A'
        }
      };
    }
    
    res.json({
      success: true,
      data: {
        id: job._id,
        jobId: job._id,
        filename: job.originalFilename,
        status: job.status,
        processedAt: job.completedAt || job.createdAt,
        linesProcessed: job.totalLines || 0,
        sentimentScore: job.averageSentiment,
        processingTime: job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) : null,
        fileSize: job.fileSize ? `${(job.fileSize / (1024*1024)).toFixed(1)} MB` : 'N/A',
        error: job.errorMessage,
        detailedResults
      }
    });
  } catch (error) {
    logger.error('History item fetch error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid history ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history item'
    });
  }
};

/**
 * Delete history record
 */
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    logger.info(`Delete history requested: ${id} by user ${userId}`);
    
    // Find and delete the job
    const result = await ProcessingJob.deleteOne({
      _id: id,
      userId,
      status: { $in: ['completed', 'failed', 'cancelled'] } // Only allow delete of finished jobs
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'History record not found or cannot be deleted (job may still be processing)'
      });
    }
    
    logger.info(`History record deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'History record deleted successfully',
      data: { id }
    });
  } catch (error) {
    logger.error('Delete history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete history record'
    });
  }
};

/**
 * Export history as CSV
 */
const exportHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    logger.info(`Export history requested: ${id} by user ${userId}`);
    
    // Find the job
    const job = await ProcessingJob.findOne({
      _id: id,
      userId
    }).select('filename originalFilename status totalLines averageSentiment processingTimeMs createdAt completedAt fileSize results');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Generate CSV content
    let csvData = 'Line Number,Original Text,Sentiment Score,Sentiment Label,Keywords\n';
    
    if (job.results && job.results.length > 0) {
      job.results.forEach(result => {
        const line = `"${result.lineNumber}","${(result.originalText || '').replace(/"/g, '""')}","${result.sentimentScore || ''}","${result.sentimentLabel || ''}","${(result.keywords || []).join(', ')}"\n`;
        csvData += line;
      });
    }
    
    // Add summary at the end
    csvData += `\n\nSUMMARY\n`;
    csvData += `Filename,${job.originalFilename}\n`;
    csvData += `Status,${job.status}\n`;
    csvData += `Total Lines,${job.totalLines || 0}\n`;
    csvData += `Average Sentiment,${job.averageSentiment || 0}\n`;
    csvData += `Processing Time,${job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) + 's' : 'N/A'}\n`;
    csvData += `Processed At,${job.completedAt || job.createdAt}\n`;
    
    // Set proper headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export_${job.originalFilename.replace(/\.[^/.]+$/, "")}_${Date.now()}.csv"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(csvData);
  } catch (error) {
    logger.error('Export history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export history'
    });
  }
};

/**
 * Search through history - UPDATED WITH SNIPPETS
 */
const searchHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    // We check both 'q' and 'search' to be safe
    const { q, search, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const searchTerm = q || search;
    
    // DEBUG LOG: Check your backend terminal for this!
    if (searchTerm) console.log(`[BACKEND] Searching for: "${searchTerm}"`);

    const query = buildSearchQuery(userId, searchTerm);
    
    // Date/Status Filters
    if (status && status !== 'all') query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const total = await ProcessingJob.countDocuments(query);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 1. Build Query
    let jobQuery = ProcessingJob.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 2. Fetch 'textContent' ONLY if searching (needed for snippet)
    if (searchTerm) {
        jobQuery = jobQuery.select('filename originalFilename status totalLines averageSentiment createdAt completedAt +textContent');
    } else {
        jobQuery = jobQuery.select('filename originalFilename status totalLines averageSentiment createdAt completedAt');
    }
    
    const results = await jobQuery;
    
    // 3. Generate Snippets
    const formattedResults = results.map(job => {
      let snippet = null;
      if (searchTerm && job.textContent) {
         const lowerText = job.textContent.toLowerCase();
         const lowerTerm = searchTerm.toLowerCase();
         const index = lowerText.indexOf(lowerTerm);

         if (index !== -1) {
            // Cut 60 chars before and after
            const start = Math.max(0, index - 60);
            const end = Math.min(job.textContent.length, index + searchTerm.length + 60);
            snippet = (start > 0 ? '...' : '') + job.textContent.substring(start, end) + (end < job.textContent.length ? '...' : '');
         }
      }

      return {
        id: job._id,
        filename: job.originalFilename,
        status: job.status,
        linesProcessed: job.totalLines || 0,
        sentimentScore: job.averageSentiment,
        snippet: snippet // <--- Sending snippet
      };
    });
    
    res.json({
      success: true,
      data: {
        results: formattedResults,
        query: searchTerm || '',
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    logger.error('Search history error:', error);
    res.status(500).json({ success: false, message: 'Failed to search history' });
  }
};

// EXPORT ALL FUNCTIONS
module.exports = {
  getHistory,
  getHistoryById,
  deleteHistory,
  exportHistory,
  searchHistory
};