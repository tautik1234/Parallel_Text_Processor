const mongoose = require('mongoose');

const ProcessingJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchId: {
    type: String,
    index: true 
  },
  filename: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  // --- ADD THIS NEW FIELD ---
  textContent: { 
    type: String, 
    //select: false // Performance: Only fetch this when explicitly searching/exporting
  },
  // --------------------------
  filePath: String,
  fileSize: Number,
  fileType: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  errorMessage: String,
  
  // Processing configuration
  parallelWorkers: {
    type: Number,
    default: 4
  },
  batchSize: {
    type: Number,
    default: 1000
  },
  
  // Processing results
  totalLines: Number,
  processingTimeMs: Number,
  workersUsed: Number,
  averageSentiment: Number,
  sentimentDistribution: {
    positive: Number,
    neutral: Number,
    negative: Number
  },
  
  // Results (embedded documents)
  results: [{
    lineNumber: Number,
    originalText: String,
    sentimentScore: Number,
    sentimentLabel: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    },
    keywords: [String],
    patternsFound: [String],
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes for faster queries
ProcessingJobSchema.index({ userId: 1, createdAt: -1 });
ProcessingJobSchema.index({ status: 1 });
ProcessingJobSchema.index({ 'createdAt': -1 });
ProcessingJobSchema.index({ batchId: 1 });

// --- ADD TEXT SEARCH INDEX ---
// This allows regex-like searching but much faster for whole words
ProcessingJobSchema.index({ textContent: 'text', originalFilename: 'text' });

module.exports = mongoose.model('ProcessingJob', ProcessingJobSchema);