import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, Moon, Code, Terminal } from 'lucide-react';
import { configureCompactLanguage, compactExamples } from './monaco/compactLanguage';

const NODE_ENV = 'production';

// API Base URL - points to your actual backend server
const API_BASE_URL = NODE_ENV === 'production' 
  ? 'https://midnight.wego.pics' 
  : 'http://localhost:3001';

const CONTRACT_COMPACT = ``;

const WITNESSES_TS = `import { Ledger } from "./managed/bboard/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type BBoardPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createBBoardPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
}; `

function App() {
  const [activeTab, setActiveTab] = useState('contract');
  const [contractCode, setContractCode] = useState(CONTRACT_COMPACT);
  const [witnessesCode, setWitnessesCode] = useState(WITNESSES_TS);
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastCompileTime, setLastCompileTime] = useState(null);
  const [examples, setExamples] = useState({});
  const [contractInfo, setContractInfo] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    try {
      // Configure Compact language using modular configuration
      const configSuccess = configureCompactLanguage(monaco);
      
      if (!configSuccess) {
        console.warn('Falling back to basic Monaco configuration');
        // Set a basic theme as fallback
        monaco.editor.setTheme('vs-dark');
      }
    } catch (error) {
      console.error('Error configuring Monaco editor:', error);
      // Fallback to basic configuration
      monaco.editor.setTheme('vs-dark');
    }
  };

  const compileCode = async () => {
    // Get both contract and witnesses code regardless of active tab
    const contractContent = contractCode;
    const witnessesContent = witnessesCode;
    
    if (!contractContent.trim()) {
      setOutput('Error: No contract code to compile');
      return;
    }

    setIsCompiling(true);
    setOutput('🔨 Compiling contract using create-midnight-app...\nThis may take a few moments for the first compilation.');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/compile`, { 
        contractCode: contractContent,
        witnessesCode: witnessesContent,
        options: {
          execute: false // Just compile for now
        }
      });
      
      if (response.data.success) {
        let outputText = '✅ Compilation Successful!\n\n';
        
        if (response.data.output) {
          outputText += '--- Build Output ---\n' + response.data.output + '\n\n';
        }
        
        if (response.data.contractInfo && response.data.contractInfo.functions.length > 0) {
          outputText += '--- Available Functions ---\n';
          response.data.contractInfo.functions.forEach(func => {
            outputText += `• ${func}()\n`;
          });
          outputText += '\n';
          setContractInfo(response.data.contractInfo);
          console.log('Contract info loaded:', response.data.contractInfo);
          // Use contractInfo for future function execution features
        }
        
        if (response.data.errors && response.data.errors.length > 0) {
          outputText += '--- Warnings ---\n' + response.data.errors.join('\n') + '\n\n';
        }
        
        
        setOutput(outputText);
        setLastCompileTime(new Date().toLocaleTimeString());
      } else {
        let errorText = '❌ Compilation Failed\n\n';
        
        if (response.data.errors && response.data.errors.length > 0) {
          // Extract just the essential Compact error instead of showing full output
          const fullError = response.data.errors.join('\n');
          const compactError = extractCompactError(fullError);
          errorText += compactError;
        } else if (response.data.output) {
          // Also try to extract error from output if no specific errors array
          const compactError = extractCompactError(response.data.output);
          errorText += compactError;
        }
        
        setOutput(errorText);
      }
    } catch (error) {
      let errorMessage = '❌ Compilation Error\n\n';
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        if (errorData.errors && errorData.errors.length > 0) {
          // Extract just the essential Compact error
          const fullError = errorData.errors.join('\n');
          const compactError = extractCompactError(fullError);
          errorMessage += compactError;
        } else if (errorData.error) {
          const compactError = extractCompactError(errorData.error);
          errorMessage += compactError;
        }
      } else {
        errorMessage += `Network Error: ${error.message}`;
      }
      
      setOutput(errorMessage);
    } finally {
      setIsCompiling(false);
    }
  };

  const deployContract = async () => {
    // Get both contract and witnesses code regardless of active tab
    const contractContent = contractCode;
    const witnessesContent = witnessesCode;
    
    if (!contractContent.trim()) {
      setOutput('Error: No contract code to deploy');
      return;
    }

    setIsDeploying(true);
    setOutput('🚀 Compiling and building contract to testnet using npm run compile and npm run build...\nThis may take a few minutes.');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/deploy`, { 
        contractCode: contractContent,
        witnessesCode: witnessesContent
      });
      
      if (response.data.success) {
        let outputText = '✅ Compile and Build Successful!\n\n';

        if (response.data.output) {
          outputText += '--- Compile and Build Output ---\n' + response.data.output + '\n\n';
        }
        
        // Display available functions
        if (response.data.functions && response.data.functions.length > 0) {
          outputText += '--- Available Functions ---\n';
          response.data.functions.forEach(func => {
            outputText += `• ${func.displayName || func.name}\n`;
          });
          outputText += '\nYou can now execute these functions using the buttons below.\n\n';
          
          setAvailableFunctions(response.data.functions);
        }
        
        if (response.data.errors && response.data.errors.length > 0) {
          outputText += '--- Warnings ---\n' + response.data.errors.join('\n') + '\n\n';
        }
        
        
        
        setOutput(outputText);
        setLastCompileTime(new Date().toLocaleTimeString());
      } else {
        let errorText = '❌ Compile and Build Failed\n\n';

        console.log('🔍 SERVER RESPONSE DATA:', response.data);

        // Check output first as it often contains the actual TypeScript errors
        if (response.data.output) {
          console.log('🔍 CALLING extractCompactError WITH OUTPUT:', response.data.output);
          const compactError = extractCompactError(response.data.output);
          errorText += compactError;
          
      
        } else if (response.data.errors && response.data.errors.length > 0) {
          // Fallback to errors array
          const fullError = response.data.errors.join('\n');
          console.log('🔍 CALLING extractCompactError WITH ERRORS:', fullError);
          const compactError = extractCompactError(fullError);
          errorText += compactError;
        }
        
        setOutput(errorText);
      }
    } catch (error) {
      let errorMessage = '❌ Deployment Error\n\n';
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        if (errorData.errors && errorData.errors.length > 0) {
          // Extract just the essential Compact error
          const fullError = errorData.errors.join('\n');
          const compactError = extractCompactError(fullError);
          errorMessage += compactError;
        } else if (errorData.error) {
          const compactError = extractCompactError(errorData.error);
          errorMessage += compactError;
        }
      } else {
        errorMessage += `Network Error: ${error.message}`;
      }
      
      setOutput(errorMessage);
    } finally {
      setIsDeploying(false);
    }
  };



  // Function to extract just the essential Compact compiler error
  const extractCompactError = (errorText) => {
    if (!errorText) return errorText;
    
    // Console log the full error for debugging
    console.log('🔍 FULL ERROR TEXT:', errorText);
    
    // First, look for TypeScript errors with file location in the full text
    const tsErrorWithLocationMatch = errorText.match(/([\w/.]+\.ts)\((\d+),(\d+)\):\s*(error TS\d+:[^}]+)/);
    if (tsErrorWithLocationMatch) {
      const [, fileName, line, column, errorMsg] = tsErrorWithLocationMatch;
      const formattedError = `${fileName} line ${line}, column ${column}:\n${errorMsg}`;
      console.log('🔍 FOUND TS ERROR WITH LOCATION:', formattedError);
      return formattedError.trim();
    }
    
    // Fallback: look for TypeScript errors without location info
    const tsErrorMatch = errorText.match(/error TS\d+:[^}]+/);
    if (tsErrorMatch) {
      console.log('🔍 FOUND TS ERROR IN FULL TEXT:', tsErrorMatch[0]);
      return tsErrorMatch[0].trim();
    }
    
    // Split into lines and filter out unwanted lines
    const lines = errorText.split('\n');
    console.log('🔍 ALL LINES:', lines);
    
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim();
      // Keep lines that contain "witness" (even if they start with npm or >)
      if (trimmedLine.toLowerCase().includes('witness')) {
        console.log('🔍 KEEPING WITNESS LINE:', trimmedLine);
        return true;
      }
      // Remove lines starting with npm
      if (trimmedLine.startsWith('npm ')) return false;
      // Remove lines starting with >
      if (trimmedLine.startsWith('>')) return false;
      // Remove empty lines
      if (!trimmedLine) return false;
      return true;
    });
    
    console.log('🔍 FILTERED LINES:', filteredLines);
    
    // Look for the main Exception line
    const exceptionLine = filteredLines.find(line => 
      line.includes('Exception:') && 
      (line.includes('bboard.compact') || line.includes('witnesses.ts') || line.includes('.compact') || line.includes('.ts'))
    );
    
    console.log('🔍 EXCEPTION LINE FOUND:', exceptionLine);
    
    if (exceptionLine) {
      // Find the detailed error message that follows
      const exceptionIndex = filteredLines.indexOf(exceptionLine);
      let errorMessage = exceptionLine;
      
      // Check if the next line contains additional error details
      if (exceptionIndex + 1 < filteredLines.length) {
        const nextLine = filteredLines[exceptionIndex + 1].trim();
        if (nextLine && !nextLine.includes('npm ') && !nextLine.startsWith('>')) {
          errorMessage += '\n' + nextLine;
        }
      }
      
      console.log('🔍 RETURNING EXCEPTION MESSAGE:', errorMessage);
      return errorMessage.trim();
    }
    
    // Look for witnesses-related errors specifically (any line containing "witness")
    const witnessErrorLines = filteredLines.filter(line => {
      // Use regex to find "witness" anywhere in the line (case insensitive)
      const witnessRegex = /witness/i;
      return witnessRegex.test(line);
    });
    
    console.log('🔍 WITNESS ERROR LINES FOUND:', witnessErrorLines);
    
    if (witnessErrorLines.length > 0) {
      console.log('🔍 RETURNING WITNESS ERROR:', witnessErrorLines.join('\n'));
      return witnessErrorLines.join('\n').trim();
    }
    
    // Look for build failures that might be TypeScript/witnesses related
    const buildFailureLines = filteredLines.filter(line => {
      return line.includes('build failed') || 
             line.includes('tsc ') || 
             line.includes('TypeScript') ||
             line.includes('tsconfig') ||
             (line.includes('Lifecycle script') && line.includes('build'));
    });
    
    console.log('🔍 BUILD FAILURE LINES FOUND:', buildFailureLines);
    
    if (buildFailureLines.length > 0) {
      // Add a helpful message for TypeScript build failures
      const buildErrorMessage = buildFailureLines.join('\n') + '\n\n' + 
                               '💡 This appears to be a TypeScript compilation error.\n' +
                               'Check your witnesses.ts file for syntax errors, type issues, or missing imports.';
      console.log('🔍 RETURNING BUILD FAILURE:', buildErrorMessage);
      return buildErrorMessage;
    }
    
    // If no Exception found, look for TypeScript errors
    const tsError = filteredLines.find(line => line.includes('error TS'));
    console.log('🔍 TS ERROR FOUND:', tsError);
    
    if (tsError) {
      console.log('🔍 RETURNING TS ERROR:', tsError);
      return tsError.trim();
    }
    
    // If no specific error pattern found, return the filtered text
    const finalResult = filteredLines.join('\n').trim();
    console.log('🔍 RETURNING FINAL FILTERED TEXT:', finalResult);
    return finalResult;
  };

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'contract':
        return contractCode;
      case 'witnesses':
        return witnessesCode;
      default:
        return contractCode;
    }
  };

  const getCurrentLanguage = () => {
    switch (activeTab) {
      case 'contract':
        return 'compact';
      case 'witnesses':
        return 'typescript';
      default:
        return 'compact';
    }
  };

  const handleCodeChange = (value) => {
    if (activeTab === 'contract') {
      setContractCode(value);
    } else if (activeTab === 'witnesses') {
      setWitnessesCode(value);
    }
  };

  const loadExamples = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/examples`);
      if (response.data.success) {
        setExamples(response.data.examples);
      }
    } catch (error) {
      console.warn('Could not load examples:', error);
    }
  };

  const loadExample = (exampleName) => {
    try {
      // First try server examples, then fall back to local examples
      if (examples && examples[exampleName]) {
        setContractCode(examples[exampleName]);
      } else if (compactExamples && compactExamples[exampleName]) {
        setContractCode(compactExamples[exampleName]);
      } else {
        console.warn(`Example '${exampleName}' not found`);
        return;
      }
      setOutput('');
      setContractInfo(null);
    } catch (error) {
      console.error('Error loading example:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      compileCode();
    }
  };

  // Load examples on component mount
  React.useEffect(() => {
    loadExamples();
  }, []);

  return (
    <div className="ide-container">
      <header className="header">
        <h1>
          <Moon size={24} />
          Compact Midnight IDE
        </h1>
        <div className="header-controls">
          <div className="example-buttons">
            {/* Combine server examples and local examples */}
            {[...new Set([
              ...(examples ? Object.keys(examples) : []),
              ...(compactExamples ? Object.keys(compactExamples) : [])
            ])].map(exampleName => (
              <button 
                key={exampleName}
                className="btn"
                onClick={() => {
                  loadExample(exampleName);
                  setActiveTab('contract'); // Switch to contract tab when loading example
                }}
                disabled={isCompiling}
                title={`Load ${exampleName} example`}
              >
                {exampleName.charAt(0).toUpperCase() + exampleName.slice(1)}
              </button>
            ))}
          </div>
          <button 
            className="btn" 
            onClick={compileCode}
            disabled={isCompiling || isDeploying}
          >
            {isCompiling ? (
              <>
                <div className="spinner"></div>
                Compiling...
              </>
            ) : (
              <>
                <Code size={16} />
                Compile Contract
              </>
            )}
          </button>
          <button 
            className="btn btn-success" 
            onClick={deployContract}
            disabled={isCompiling || isDeploying}
          >
            {isDeploying ? (
              <>
                <div className="spinner"></div>
                Building...
              </>
            ) : (
              <>
                <Play size={16} />
                Compile & Build
              </>
            )}
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="editor-panel">
          <div className="panel-header">
            <div className="tab-container">
              <button
                className={`tab ${activeTab === 'contract' ? 'active' : ''}`}
                onClick={() => setActiveTab('contract')}
              >
                <Code size={14} />
                contract.compact
              </button>
              <button
                className={`tab ${activeTab === 'witnesses' ? 'active' : ''}`}
                onClick={() => setActiveTab('witnesses')}
              >
                <Code size={14} />
                witnesses.ts
              </button>
            </div>
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              language={getCurrentLanguage()}
              value={getCurrentCode()}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              onKeyDown={handleKeyDown}
              options={{
                theme: 'compact-midnight-theme',
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                minimap: { enabled: false },
                wordWrap: 'on',
                tabSize: 2,
                insertSpaces: true,
                quickSuggestions: false,
                parameterHints: { enabled: false },
                codeLens: false,
                contextmenu: false,
                folding: false,
                links: false,
                hover: { enabled: false },
                // Both tabs are now editable
              }}
            />
          </div>
        </div>

        <div className="output-panel">
          <div className="panel-header">
            <Terminal size={14} />
            Output
            {availableFunctions.length > 0 && (
              <span className="function-count">({availableFunctions.length} functions available)</span>
            )}
          </div>
          
      
          
          <div className="output-content">
            {output ? (
              <div className={output.startsWith('Error:') ? 'output-error' : 'output-success'}>
                {output}
              </div>
            ) : (
              <div className="output-info">
                <div className="example-code">
                  <h3>🌙 Welcome to Compact Midnight IDE!</h3>
                  <p>Write real Compact smart contracts and compile them using compact web ide. Click "Compile Contract" or "Compile & Build" to build your contract.</p>
                  
              
              
                  
                  <h3 style={{ marginTop: '16px' }}>🔧 Try the Examples:</h3>
                  <p>Use the example buttons above to load pre-built contracts: Counter, Voting, and Message contracts.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="status-bar">
        <span>Compact Midnight DSL</span>
        {lastCompileTime && <span>Last compiled: {lastCompileTime}</span>}
        <span>Ready</span>
      </div>
    </div>
  );
}

export default App;
