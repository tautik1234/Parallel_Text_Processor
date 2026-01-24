// services/python-integration.service.js
const fs = require('fs').promises;  // Add at top
const path = require('path');
const axios = require('axios');
const { logger } = require('../utils/logger');
const config = require('../config/config');

class PythonIntegrationService {
  constructor() {
    this.pythonApiBaseUrl = config.pythonApi.url || 'http://localhost:8000';
    this.timeout = config.pythonApi.timeout || 300000; // 5 minutes for large files
  }

  /**
   * Call Python API to process file
   */
  async processFileWithPython(filePath, jobId, userId, mongoUri) {
    try {
      logger.info(`Calling Python API for job ${jobId}, file: ${filePath}`);
      const fileContent = await fs.readFile(filePath, 'utf-8');

      logger.info(`Sending file content to Python for job ${jobId}`);
      logger.info(`Content length: ${fileContent.length} characters`);

      const payload = {
        content: fileContent,      // ← Send the ACTUAL text
        filename: path.basename(filePath),
        jobId: jobId,
        userId: userId,
        mongoUri: mongoUri || process.env.MONGO_URI
      };

      const response = await axios.post(
        `${this.pythonApiBaseUrl}/process-content`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Python API call failed:', { error: error.message });

      let errorMessage = 'Failed to process with Python API';
      let errorDetails = {};

      if (error.response) {
        // Python API returned error
        errorMessage = error.response.data.error || errorMessage;
        errorDetails = error.response.data;
        logger.error('Python API error response:', error.response.data);
      } else if (error.request) {
        // No response received
        errorMessage = 'Python API is not responding';
        logger.error('No response from Python API');
      } else {
        // Request setup error
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
    }
  }

  /**
 * Call Python API to process direct text (not file)
 */
  async processTextWithPython(text, jobId, userId, mongoUri) {
    try {
      logger.info(`Calling Python API for direct text processing, job ${jobId}, text length: ${text.length}`);

      const payload = {
        content: text,
        filename: 'direct_text_input.txt',
        jobId: jobId,
        userId: userId,
        mongoUri: mongoUri || process.env.MONGO_URI
      };

      const response = await axios.post(
        `${this.pythonApiBaseUrl}/process-content`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Python API call failed for direct text:', { error: error.message });

      let errorMessage = 'Failed to process text with Python API';
      let errorDetails = {};

      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
        errorDetails = error.response.data;
        logger.error('Python API error response:', error.response.data);
      } else if (error.request) {
        errorMessage = 'Python API is not responding';
        logger.error('No response from Python API for direct text');
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        details: errorDetails
      };
    }
  }

  /**
   * Test Python API connection
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.pythonApiBaseUrl}/health`, {
        timeout: 5000
      });

      return {
        connected: true,
        status: response.data.status,
        modelsLoaded: response.data.models_loaded,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze single text (for testing/debugging)
   */
  async analyzeSingleText(text) {
    try {
      const response = await axios.post(
        `${this.pythonApiBaseUrl}/analyze`,
        { text },
        { timeout: 10000 }
      );

      return {
        success: true,
        result: response.data.result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test MongoDB connection through Python API
   */
  async testMongoConnection() {
    try {
      const response = await axios.get(`${this.pythonApiBaseUrl}/test-mongo`, {
        timeout: 5000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PythonIntegrationService();