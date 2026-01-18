// test-integration.js
const PythonIntegrationService = require('./services/python-integration.service');

async function testIntegration() {
  console.log('🔍 Testing Node.js + Python Integration...\n');
  
  // 1. Test Python API connection
  console.log('1. Testing Python API connection...');
  const connection = await PythonIntegrationService.testConnection();
  console.log(connection.connected ? '✅ Python API connected' : '❌ Python API not connected');
  console.log('Details:', JSON.stringify(connection, null, 2));
  
  if (connection.connected) {
    // 2. Test MongoDB through Python
    console.log('\n2. Testing MongoDB connection through Python...');
    const mongoTest = await PythonIntegrationService.testMongoConnection();
    console.log(mongoTest.success ? '✅ MongoDB accessible via Python' : '❌ MongoDB connection failed');
    
    // 3. Test single text analysis
    console.log('\n3. Testing single text analysis...');
    const textResult = await PythonIntegrationService.analyzeSingleText(
      'This is excellent service! Very happy with the results.'
    );
    console.log(textResult.success ? '✅ Text analysis working' : '❌ Text analysis failed');
    if (textResult.success) {
      console.log('Result:', {
        sentiment: textResult.result.sentimentLabel,
        score: textResult.result.sentimentScore,
        confidence: textResult.result.confidence
      });
    }
  }
  
  console.log('\n📊 Integration test complete!');
}

testIntegration().catch(console.error);