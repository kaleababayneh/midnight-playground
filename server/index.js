const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WorkspaceManager } = require('./workspace-manager');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://midnight-playground-one.vercel.app',
    'https://midnight-playground.vercel.app',
    'https://*.vercel.app' 
  ],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize Workspace Manager
const workspaceManager = new WorkspaceManager();

// Routes
app.post('/api/compile', async (req, res) => {
  try {
    const { contractCode, witnessesCode } = req.body;
    
    if (!contractCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'No contract code provided' 
      });
    }

    console.log('Compiling contract...');
    console.log('Contract code length:', contractCode.length);
    console.log('Witnesses code length:', witnessesCode ? witnessesCode.length : 0);
    
    // Update both contract and witnesses files
    await workspaceManager.updateContract(contractCode);
    if (witnessesCode) {
      await workspaceManager.updateWitnesses(witnessesCode);
    }
    
    // Then compile
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

// Deploy contract (compile and deploy to testnet)
app.post('/api/deploy', async (req, res) => {
  try {
    const { contractCode, witnessesCode } = req.body;
    
    if (contractCode) {
      // Update the contract code first
      await workspaceManager.updateContract(contractCode);
    }
    if (witnessesCode) {
      // Update the witnesses code
      await workspaceManager.updateWitnesses(witnessesCode);
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
