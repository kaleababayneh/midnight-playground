export const compactTokenizer = {
  tokenizer: {
    root: [
      // Comments (must come before other patterns to avoid conflicts)
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
      
      // Keywords from official VS Code extension
      [/\b(as|assert|circuit|constructor|const|contract|do|else|enum|fold|for|if|in|include|ledger|new|map|null|over|pad|pragma|prefix|return|struct|to|witness|pure|sealed)\b/, 'keyword'],
      
      // Import/Export keywords
      [/\b(import|module|export)\b/, 'keyword.import'],
      
      // Boolean constants
      [/\b(true|false)\b/, 'constant.boolean'],
      
      // Support classes/types from official extension
      [/\b(Bytes|Boolean|Integer|Field|Opaque|Unsigned|Vector|Void|Kernel|Counter|Cell|Set|List|Map|MerkleTree|HistoricMerkleTree)\b/, 'type'],
      
      // Additional common types
      [/\b(Uint|Int|Bool)\b/, 'type'],
      
      // Hex numbers
      [/\b0[xX][0-9a-fA-F]+\b/, 'number.hex'],
      
      // Binary numbers
      [/\b0[bB][01]+\b/, 'number.binary'],
      
      // Octal numbers
      [/\b0[oO]?[0-7]+\b/, 'number.octal'],
      
      // Decimal numbers (including floats)
      [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, 'number'],
      [/\B\.\d+([eE][+-]?\d+)?\b/, 'number'],
      
      // String literals
      [/"([^"\\]|\\.)*"/, 'string'],
      [/'([^'\\]|\\.)*'/, 'string'],
      
      // Operators
      [/[+\-*/=<>!&|%^~]/, 'operator'],
      
      // Brackets and delimiters
      [/[{}()[\]:;,.]/, 'delimiter'],
      
      // Identifiers
      [/\b[a-zA-Z_]\w*\b/, 'identifier'],
    ],
    
    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment']
    ],
  },
};


export const compactLanguageConfig = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
    { open: "'", close: "'", notIn: ['string'] }
  ],
  surroundingPairs: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
    ['"', '"'],
    ["'", "'"]
  ]
};

/**
 * Compact Midnight theme for Monaco Editor
 * Colors match VS Code Dark+ theme for consistency
 */
export const compactMidnightTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // Keywords - blue like VS Code
    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
    { token: 'keyword.import', foreground: 'c586c0', fontStyle: 'bold' },
    
    // Types - cyan/teal
    { token: 'type', foreground: '4ec9b0', fontStyle: 'bold' },
    
    // Constants
    { token: 'constant.boolean', foreground: '569cd6' },
    
    // Strings - orange
    { token: 'string', foreground: 'ce9178' },
    
    // Numbers - light green with different shades for different types
    { token: 'number', foreground: 'b5cea8' },
    { token: 'number.hex', foreground: 'b5cea8' },
    { token: 'number.binary', foreground: 'b5cea8' },
    { token: 'number.octal', foreground: 'b5cea8' },
    
    // Comments - green italic
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    
    // Identifiers - light blue
    { token: 'identifier', foreground: '9cdcfe' },
    
    // Operators - white
    { token: 'operator', foreground: 'd4d4d4' },
    
    // Delimiters - light gray
    { token: 'delimiter', foreground: 'd4d4d4' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editorLineNumber.foreground': '#858585',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#3a3d41',
  },
};

/**
 * Configure Monaco Editor for Compact language
 * @param {object} monaco - Monaco editor instance
 */
export const configureCompactLanguage = (monaco) => {
  if (!monaco) {
    console.error('❌ Monaco editor instance not provided');
    return false;
  }

  try {
    // Check if monaco has required APIs
    if (!monaco.languages || !monaco.editor) {
      console.error('❌ Monaco editor APIs not available');
      return false;
    }

    // Register the Compact language
    monaco.languages.register({ id: 'compact' });
    
    // Set the tokenizer
    monaco.languages.setMonarchTokensProvider('compact', compactTokenizer);
    
    // Set language configuration
    monaco.languages.setLanguageConfiguration('compact', compactLanguageConfig);
    
    // Define and set the theme
    monaco.editor.defineTheme('compact-midnight-theme', compactMidnightTheme);
    monaco.editor.setTheme('compact-midnight-theme');
    
    console.log('✅ Compact language configuration loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to configure Compact language:', error);
    console.error('Error details:', error.message, error.stack);
    return false;
  }
};

/**
 * Example Compact contracts for testing syntax highlighting
 */
export const compactExamples = {
  counter: `pragma language_version 0.17;
import CompactStandardLibrary;

export ledger count: Counter;

export circuit increment(value: Uint<16>): [] {
  count.increment(disclose(value));
}

export circuit decrement(value: Uint<16>): [] {
  count.decrement(disclose(value));
}

export circuit get_count(): Uint<64> {
  return count;
}`,

  voting: `pragma language_version 0.17;
import CompactStandardLibrary;

export ledger votes_for: Counter;
export ledger votes_against: Counter;

export circuit vote_yes(): [] {
  votes_for.increment(1);
}

export circuit vote_no(): [] {
  votes_against.increment(1);
}

export circuit get_results(): [Uint<64>, Uint<64>] {
  return [votes_for, votes_against];
}`,

  message: `pragma language_version 0.17;

import CompactStandardLibrary;

export ledger messages: List<Opaque<"string">>;

export circuit post_message(message: Opaque<"string">): [] {
  messages.pushFront(disclose(message));
}

export circuit get_message_count(): Uint<64> {
  return messages.length();
}`,
}