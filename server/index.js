const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WorkspaceManager } = require('./workspace-manager');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize Workspace Manager
const workspaceManager = new WorkspaceManager();

// Routes
app.post('/api/compile', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'No Compact code provided' 
      });
    }

    console.log('Compiling contract...');
    
    // Update the contract code first
    await workspaceManager.updateContract(code);
    
    // Then compile it
    const result = await workspaceManager.compile();
    
    res.json(result);
  } catch (error) {
    console.error('Compilation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

// Get example contracts
app.get('/api/examples', (req, res) => {
  try {
    const examples = workspaceManager.getExampleContracts();
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
    const { functionName, args } = req.body;
    
    if (!functionName) {
      return res.status(400).json({
        success: false,
        error: 'Function name is required'
      });
    }

    console.log('Executing function:', functionName, 'with args:', args);
    const result = await workspaceManager.executeFunction(functionName, args);
    res.json(result);
  } catch (error) {
    console.error('Function execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deploy contract (compile and deploy to testnet)
app.post('/api/deploy', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (code) {
      // Update the contract code first
      await workspaceManager.updateContract(code);
    }

    console.log('Deploying contract to testnet...');
    const result = await workspaceManager.deploy();
    
    res.json(result);
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Compact Midnight IDE Server with create-midnight-app integration running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌙 Compact Midnight IDE Server running on port ${PORT}`);
  console.log(`📦 Using workspace deployment with npm run deploy`);
  console.log(`🚀 Ready to compile and deploy Compact contracts`);
});
