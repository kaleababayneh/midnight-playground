# Monaco Editor Configuration

This directory contains modular Monaco Editor configurations for the Compact Midnight IDE.

## Files

### `compactLanguage.js`
Main configuration file for Compact language support in Monaco Editor.

**Exports:**
- `compactTokenizer` - Monarch tokenizer rules for syntax highlighting
- `compactLanguageConfig` - Language configuration (brackets, comments, etc.)
- `compactMidnightTheme` - Dark theme matching VS Code
- `configureCompactLanguage(monaco)` - Main configuration function
- `compactExamples` - Example Compact contracts

**Features:**
- ✅ Official VS Code extension syntax rules
- ✅ Complete keyword and type highlighting
- ✅ Number format detection (hex, binary, octal, decimal)
- ✅ String and comment parsing
- ✅ Auto-closing brackets and pairs
- ✅ VS Code-like color theme

## Usage

```javascript
import { configureCompactLanguage, compactExamples } from './monaco/compactLanguage';

// Configure Monaco Editor
const handleEditorDidMount = (editor, monaco) => {
  const success = configureCompactLanguage(monaco);
  if (!success) {
    console.warn('Failed to configure Compact language');
  }
};

// Use example contracts
const counterExample = compactExamples.counter;
```

## Architecture Benefits

1. **Modularity** - Language configuration separated from main component
2. **Reusability** - Can be imported by other components
3. **Maintainability** - Easy to update syntax rules
4. **Testability** - Configuration can be unit tested
5. **Documentation** - Clear separation of concerns

## Based On

This configuration is extracted from the official VS Code Compact extension:
- `compact.tmLanguage.json` - TextMate grammar
- `language-configuration.json` - Language settings

The syntax highlighting matches the official VS Code extension pixel-perfect.
