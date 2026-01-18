module.exports = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: '24h'
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['.txt', '.csv', '.pdf', '.json'],
    uploadDir: 'uploads/'
  },
  
  // Email Configuration (Placeholder - to be filled by team)
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  
  // Text Processing Configuration
  processing: {
    batchSize: 1000, // lines per batch
    parallelWorkers: 4 // number of parallel workers
  },

  // Python API Configuration
  pythonApi: {
    url: process.env.PYTHON_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.PYTHON_API_TIMEOUT) || 300000, // 5 minutes
    retries: parseInt(process.env.PYTHON_API_RETRIES) || 3
  },

  // Processing Configuration
  processing: {
    // ... existing ...
    usePythonApi: process.env.USE_PYTHON_API === 'true' || true, // Enable Python integration
    fallbackToSimulation: process.env.FALLBACK_TO_SIMULATION === 'true' || true
  }
};