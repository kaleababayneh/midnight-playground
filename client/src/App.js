import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, Moon, Code, Terminal } from 'lucide-react';

const EXAMPLE_CODE = `// Compact Midnight DSL Example
// Variable declarations
let x = 10
let y = 20
let name = "Midnight"

// Arithmetic operations
let sum = x + y
let product = x * y

// Print statements
print "Hello from Compact Midnight!"
print name
print "Sum: " + sum
print "Product: " + product

// Built-in functions
print "Square root of 16: " + sqrt(16)
print "Absolute value of -5: " + abs(-5)

// Reassignment
x = x + 5
print "Updated x: " + x`;

function App() {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastCompileTime, setLastCompileTime] = useState(null);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Simple configuration to avoid WebAssembly issues
    try {
      // Configure Monaco editor for Compact Midnight
      monaco.languages.register({ id: 'compact-midnight' });
      
      monaco.languages.setMonarchTokensProvider('compact-midnight', {
        tokenizer: {
          root: [
            [/\b(let|fn|print|if|else|while|for|return)\b/, 'keyword'],
            [/\b(sqrt|abs|sin|cos|tan|log)\b/, 'keyword.function'],
            [/"[^"]*"/, 'string'],
            [/'[^']*'/, 'string'],
            [/\b\d+(\.\d+)?\b/, 'number'],
            [/\b[a-zA-Z_]\w*\b/, 'identifier'],
            [/[+\-*/=<>!&|]/, 'operator'],
            [/[{}()\[\]]/, 'bracket'],
            [/\/\/.*$/, 'comment'],
            [/#.*$/, 'comment'],
          ],
        },
      });

      monaco.editor.defineTheme('compact-midnight-theme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '569cd6' },
          { token: 'keyword.function', foreground: 'dcdcaa' },
          { token: 'string', foreground: 'ce9178' },
          { token: 'number', foreground: 'b5cea8' },
          { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
          { token: 'identifier', foreground: '9cdcfe' },
          { token: 'operator', foreground: 'd4d4d4' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
          'editorLineNumber.foreground': '#858585',
          'editor.selectionBackground': '#264f78',
          'editor.inactiveSelectionBackground': '#3a3d41',
        },
      });

      monaco.editor.setTheme('compact-midnight-theme');
    } catch (error) {
      console.warn('Monaco configuration error:', error);
      // Fallback to basic configuration
    }
  };

  const compileCode = async () => {
    if (!code.trim()) {
      setOutput('Error: No code to compile');
      return;
    }

    setIsCompiling(true);
    setOutput('Compiling...');

    try {
      const response = await axios.post('/api/compile', { code });
      
      if (response.data.success) {
        const result = response.data.result;
        let outputText = result.output || 'Compilation successful (no output)';
        
        if (Object.keys(result.variables).length > 0) {
          outputText += '\n\n--- Variables ---\n';
          for (const [name, value] of Object.entries(result.variables)) {
            outputText += `${name}: ${value}\n`;
          }
        }
        
        setOutput(outputText);
        setLastCompileTime(new Date().toLocaleTimeString());
      } else {
        setOutput(`Error: ${response.data.error}`);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        let errorMessage = `Error: ${errorData.error}`;
        if (errorData.line) {
          errorMessage += ` (Line ${errorData.line})`;
        }
        setOutput(errorMessage);
      } else {
        setOutput(`Network Error: ${error.message}`);
      }
    } finally {
      setIsCompiling(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      compileCode();
    }
  };

  return (
    <div className="ide-container">
      <header className="header">
        <h1>
          <Moon size={24} />
          Compact Midnight IDE
        </h1>
        <div className="header-controls">
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
                Run Code
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
              language="compact-midnight"
              value={code}
              onChange={setCode}
              onMount={handleEditorDidMount}
              onKeyDown={handleKeyDown}
              options={{
                theme: 'vs-dark',
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
                  <h3>Welcome to Compact Midnight IDE!</h3>
                  <p>Start writing your code in the editor, then click "Run Code" or press Ctrl+Enter to compile and execute.</p>
                  
                  <h3 style={{ marginTop: '16px' }}>Language Features:</h3>
                  <pre>{`• Variable declarations: let x = 10
• Arithmetic: +, -, *, /
• String literals: "hello" or 'world'
• Print statements: print "text" or print(variable)
• Built-in functions: sqrt(), abs()
• Comments: // or #`}</pre>
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
