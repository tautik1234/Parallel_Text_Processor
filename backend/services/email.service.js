const nodemailer = require('nodemailer');
const config = require('../config/config');
const { logger } = require('../utils/logger');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: config.email.host || 'smtp.gmail.com', // Fallback or use env var
  port: config.email.port || 587,
  secure: config.email.secure || false, // true for 465, false for other ports
  auth: {
    user: config.email.user, // defined in .env
    pass: config.email.pass, // defined in .env
  },
});

/**
 * Send processing complete email
 */
const sendProcessingComplete = async (toEmail, filename, results) => {
  try {
    // Calculate actual time in seconds, defaulting to 0 if missing
    const timeInSeconds = results.processingTimeMs 
      ? (results.processingTimeMs / 1000).toFixed(2) 
      : '0.00';

    const mailOptions = {
      from: `"Text Processor" <${config.email.user}>`,
      to: toEmail,
      subject: `Processing Complete: ${filename}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4F46E5;">Processing Complete!</h2>
          <p>Your file <strong>${filename}</strong> has been processed successfully.</p>
          
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Results Summary:</h3>
            <ul style="list-style-type: none; padding: 0;">
              <li>📄 <strong>Total Lines:</strong> ${results.totalLines}</li>
              <li>🤖 <strong>Parallel Workers:</strong> ${results.workersUsed || results.workers || 1}</li>
              <li>😊 <strong>Average Sentiment:</strong> ${Number(results.averageSentiment).toFixed(2)}</li>
              <li>wc <strong>Processing Time:</strong> ${timeInSeconds} seconds</li>
            </ul>
          </div>
          
          <p>Login to your dashboard to view detailed results and download the full report.</p>
          <a href="${config.clientUrl || 'http://localhost:5173'}/dashboard" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </div>
      `
    };

    // SEND ACTUAL EMAIL
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${toEmail}`);
    
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    logger.error('Email sending error:', error);
    // Don't crash the app if email fails
    return { success: false, error: error.message };
  }
};

/**
 * Send processing failed email
 */
const sendProcessingFailed = async (toEmail, filename, errorMessage) => {
  try {
    const mailOptions = {
      from: `"Text Processor" <${config.email.user}>`,
      to: toEmail,
      subject: `Processing Failed: ${filename}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #DC2626;">Processing Failed</h2>
          <p>Your file <strong>${filename}</strong> failed to process.</p>
          
          <div style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; border: 1px solid #FECACA; margin: 20px 0;">
            <p style="margin: 0; color: #B91C1C;"><strong>Error Details:</strong></p>
            <p style="margin-top: 5px;">${errorMessage}</p>
          </div>
          
          <p>Please check the file format and try again, or contact support.</p>
        </div>
      `
    };

    // SEND ACTUAL EMAIL
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Failure notification sent: ${info.messageId} to ${toEmail}`);

    return { success: true, message: 'Failure notification sent' };
  } catch (error) {
    logger.error('Failure email error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send batch processing summary
 */
const sendBatchSummary = async (toEmail, batchResults) => {
  try {
    const successCount = batchResults.filter(r => r.status === 'completed').length;
    const failedCount = batchResults.filter(r => r.status === 'failed').length;
    
    // Calculate actual total time if available
    const totalTimeMs = batchResults.reduce((acc, curr) => acc + (curr.processingTimeMs || 0), 0);
    const totalTimeSec = (totalTimeMs / 1000).toFixed(2);

    const mailOptions = {
      from: `"Text Processor" <${config.email.user}>`,
      to: toEmail,
      subject: `Batch Processing Complete: ${successCount} successful, ${failedCount} failed`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4F46E5;">Batch Processing Complete</h2>
          <p>Your batch of <strong>${batchResults.length}</strong> files has been processed.</p>
          
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Batch Summary:</h3>
            <ul style="list-style-type: none; padding: 0;">
              <li>✅ <strong>Successful:</strong> ${successCount} files</li>
              <li>❌ <strong>Failed:</strong> ${failedCount} files</li>
              <li>⏱️ <strong>Total Time:</strong> ${totalTimeSec} seconds</li>
            </ul>
          </div>
          
          <p>Login to your dashboard to view detailed results for each file.</p>
        </div>
      `
    };

    // SEND ACTUAL EMAIL
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Batch summary sent: ${info.messageId} to ${toEmail}`);

    return { success: true };
  } catch (error) {
    logger.error('Batch summary email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendProcessingComplete,
  sendProcessingFailed,
  sendBatchSummary
};