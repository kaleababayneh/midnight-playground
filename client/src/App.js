import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, Moon, Code, Terminal } from 'lucide-react';
import { configureCompactLanguage, compactExamples } from './monaco/compactLanguage';



const CONTRACT_COMPACT = `
pragma language_version >= 0.16 && <= 0.17;

import CompactStandardLibrary;

export enum State {
  VACANT,
  OCCUPIED
}

export ledger state: State;

export ledger message: Maybe<Opaque<"string">>;

export ledger sequence: Counter;

export ledger owner: Bytes<32>;

constructor() {
  state = State.VACANT;
  message = none<Opaque<"string">>();
  sequence.increment(1);
}

witness localSecretKey(): Bytes<32>;

export circuit post(newMessage: Opaque<"string">): [] {
  assert(state == State.VACANT, "Attempted to post to an occupied board");
  owner = disclose(publicKey(localSecretKey(), sequence as Field as Bytes<32>));
  message = disclose(some<Opaque<"string">>(newMessage));
  state = State.OCCUPIED;
}

export circuit takeDown(): Opaque<"string"> {
  assert(state == State.OCCUPIED, "Attempted to take down post from an empty board");
  assert(owner == publicKey(localSecretKey(), sequence as Field as Bytes<32>), "Attempted to take down post, but not the current owner");
  const formerMsg = message.value;
  state = State.VACANT;
  sequence.increment(1);
  message = none<Opaque<"string">>();
  return formerMsg;
}

export circuit publicKey(sk: Bytes<32>, sequence: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<3, Bytes<32>>>([pad(32, "bboard:pk:"), sequence, sk]);
}`;

const EXAMPLE_CODE = CONTRACT_COMPACT;
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
      const response = await axios.post('/api/compile', { 
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
          errorText += '--- Errors ---\n' + response.data.errors.join('\n') + '\n\n';
        }
        
        if (response.data.output) {
          errorText += '--- Build Output ---\n' + response.data.output;
        }
        
        setOutput(errorText);
      }
    } catch (error) {
      let errorMessage = '❌ Compilation Error\n\n';
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        errorMessage += `Error: ${errorData.error}\n`;
        
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage += '\nDetails:\n' + errorData.errors.join('\n');
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
      const response = await axios.post('/api/deploy', { 
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

        if (response.data.errors && response.data.errors.length > 0) {
          errorText += '--- Errors ---\n' + response.data.errors.join('\n') + '\n\n';
        }
        
        if (response.data.output) {
          errorText += '--- Compile and Build Output ---\n' + response.data.output;
        }
        
        setOutput(errorText);
      }
    } catch (error) {
      let errorMessage = '❌ Deployment Error\n\n';
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        errorMessage += `Error: ${errorData.error}\n`;
        
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage += '\nDetails:\n' + errorData.errors.join('\n');
        }
      } else {
        errorMessage += `Network Error: ${error.message}`;
      }
      
      setOutput(errorMessage);
    } finally {
      setIsDeploying(false);
    }
  };

  const executeFunction = async (functionName) => {
    setOutput(`🔄 Executing function: ${functionName}...`);

    try {
      const response = await axios.post('/api/execute', { 
        functionName,
        args: [] // For now, no arguments
      });
      
      if (response.data.success) {
        let outputText = `✅ Function ${functionName} executed successfully!\n\n`;
        outputText += response.data.output;
        setOutput(outputText);
      } else {
        let errorText = `❌ Function ${functionName} execution failed\n\n`;
        if (response.data.errors) {
          errorText += response.data.errors.join('\n');
        }
        setOutput(errorText);
      }
    } catch (error) {
      setOutput(`❌ Error executing function ${functionName}: ${error.message}`);
    }
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
      const response = await axios.get('/api/examples');
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
          
          {/* Function execution buttons */}
          {availableFunctions.length > 0 && (
            <div className="function-buttons">
              <div className="function-header">Available Functions:</div>
              {availableFunctions.map((func, index) => (
                <button
                  key={index}
                  className="btn function-btn"
                  onClick={() => executeFunction(func.name)}
                  disabled={isDeploying}
                  title={func.description}
                >
                  {func.displayName || func.name}
                </button>
              ))}
            </div>
          )}
          
          <div className="output-content">
            {output ? (
              <div className={output.startsWith('Error:') ? 'output-error' : 'output-success'}>
                {output}
              </div>
            ) : (
              <div className="output-info">
                <div className="example-code">
                  <h3>🌙 Welcome to Compact Midnight IDE!</h3>
                  <p>Write real Compact smart contracts and compile them using your create-midnight-app integration. Click "Compile Contract" or press Ctrl+Enter to build your contract.</p>
                  
                  <h3 style={{ marginTop: '16px' }}>🚀 Powered by create-midnight-app v2.1.7</h3>
                  <p>This IDE uses your create-midnight-app npm package for real Compact compilation, auto-generated CLIs, and deployment capabilities.</p>
                  
                  <h3 style={{ marginTop: '16px' }}>📝 Compact Language Features:</h3>
                  <pre>{`• Pragma declarations: pragma language_version 0.15;
• Imports: import CompactStandardLibrary;
• Ledger state: export ledger count: Counter;
• Circuit functions: export circuit increment(value: Uint<16>): []
• Type system: Uint<16>, Counter, Vector<T>, Opaque<"string">
• Standard library: increment(), decrement(), push(), pop()
• Comments: // single line, /* multi line */`}</pre>
                  
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
