const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { CompactCompiler } = require('./compact-compiler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize Compact compiler
const compiler = new CompactCompiler();

// Routes
app.post('/api/compile', async (req, res) => {
  try {
    const { code, options = {} } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'No Compact code provided' 
      });
    }

    console.log('Compiling Compact code...');
    const result = await compiler.compile(code, options);
    
    res.json(result);
  } catch (error) {
    console.error('Compilation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      output: '',
      errors: [error.message]
    });
  }
});

// Get example contracts
app.get('/api/examples', (req, res) => {
  try {
    const examples = compiler.getExampleContracts();
    res.json({
      success: true,
      examples
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute contract function
app.post('/api/execute', async (req, res) => {
  try {
    const { functionCall } = req.body;
    
    if (!functionCall || !functionCall.function) {
      return res.status(400).json({
        success: false,
        error: 'Function call information required'
      });
    }

    const result = await compiler.executeContract(functionCall);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Compact Midnight IDE Server with create-midnight-app integration running' });
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('Cleaning up...');
  await compiler.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Cleaning up...');
  await compiler.cleanup();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🌙 Compact Midnight IDE Server with create-midnight-app integration running on port ${PORT}`);
  console.log(`📦 Using create-midnight-app v2.1.7 for real Compact compilation`);
});
