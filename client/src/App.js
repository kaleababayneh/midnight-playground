import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, Moon, Code, Terminal } from 'lucide-react';
import { configureCompactLanguage, compactExamples } from './monaco/compactLanguage';

const EXAMPLE_CODE =  `pragma language_version 0.16;
import CompactStandardLibrary;

export ledger count: Counter;

export circuit increment(value: Uint<16>): [] {
  count.increment(value);
}

export circuit decrement(value: Uint<16>): [] {
  count.decrement(value);
}

export circuit get_count(): Uint<64> {
  return count;
}`;

function App() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastCompileTime, setLastCompileTime] = useState(null);
  const [examples, setExamples] = useState({});
  const [contractInfo, setContractInfo] = useState(null);
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
    if (!code.trim()) {
      setOutput('Error: No Compact code to compile');
      return;
    }

    setIsCompiling(true);
    setOutput('🔨 Compiling Compact contract using create-midnight-app...\nThis may take a few moments for the first compilation.');

    try {
      const response = await axios.post('/api/compile', { 
        code,
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
        
        outputText += `📦 Powered by create-midnight-app v2.1.7\n`;
        outputText += `⏱️ Compiled at ${new Date().toLocaleTimeString()}`;
        
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
        setCode(examples[exampleName]);
      } else if (compactExamples && compactExamples[exampleName]) {
        setCode(compactExamples[exampleName]);
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
                onClick={() => loadExample(exampleName)}
                disabled={isCompiling}
                title={`Load ${exampleName} example`}
              >
                {exampleName.charAt(0).toUpperCase() + exampleName.slice(1)}
              </button>
            ))}
          </div>
          <button 
            className="btn btn-success" 
            onClick={compileCode}
            disabled={isCompiling}
          >
            {isCompiling ? (
              <>
                <div className="spinner"></div>
                Compiling...
              </>
            ) : (
              <>
                <Play size={16} />
                Compile Contract
              </>
            )}
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="editor-panel">
          <div className="panel-header">
            <Code size={14} />
            Editor (Ctrl+Enter to run)
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              language="compact"
              value={code}
              onChange={setCode}
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
              }}
            />
          </div>
        </div>

        <div className="output-panel">
          <div className="panel-header">
            <Terminal size={14} />
            Output
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
