const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { CompactMidnightCompiler } = require('./compiler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize compiler
const compiler = new CompactMidnightCompiler();

// Routes
app.post('/api/compile', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'No code provided' 
      });
    }

    const result = await compiler.compile(code);
    
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      line: error.line || null,
      column: error.column || null
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Compact Midnight IDE Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌙 Compact Midnight IDE Server running on port ${PORT}`);
});
