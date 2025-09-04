# Compact Midnight IDE

A modern web-based IDE for the Compact Midnight blockchain smart contracts. Write, compile, and execute real Compact code directly in your browser with official VS Code syntax highlighting, real-time compilation using create-midnight-app, and a beautiful dark theme interface.

## 🌟 Features

- **🎨 Official VS Code Syntax Highlighting**: Extracted directly from the official Compact VS Code extension
- **🔨 Real Compact Compilation**: Powered by create-midnight-app v2.1.7 for authentic contract building
- **📊 Enhanced Data Type Support**: Full support for Uint<16>, Counter, Vector<T>, Opaque<"string">, etc.
- **⚡ Modern Editor**: Monaco Editor (VS Code's engine) with auto-completion and error detection
- **🎯 Function Discovery**: Automatically detects and displays available contract functions
- **📝 Example Contracts**: Counter, Voting, and Message contracts ready to use
- **🌙 Dark Theme**: Beautiful midnight theme matching VS Code
- **⚙️ Modular Architecture**: Clean separation of concerns for maintainability

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the IDE:**
   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:3000`

## 🏗️ Project Structure

```
compact-midnight-ide/
├── client/                          # React frontend
│   ├── src/
│   │   ├── monaco/                  # Monaco Editor configurations
│   │   │   ├── compactLanguage.js   # Compact language definition
│   │   │   └── README.md           # Monaco configuration docs
│   │   ├── App.js                  # Main IDE component
│   │   └── index.css              # Styles
│   └── package.json
├── server/                         # Node.js backend
│   ├── compact-compiler.js         # Real Compact compiler integration
│   ├── index.js                   # Express server
│   └── package.json
├── package.json                   # Root package.json
└── README.md
```

## 🎨 Syntax Highlighting

The IDE uses syntax highlighting extracted directly from the official VS Code Compact extension (compact-0.2.13), providing:

- **Keywords**: `pragma`, `import`, `export`, `circuit`, `ledger`, `witness`, etc.
- **Types**: `Uint<16>`, `Counter`, `Vector<T>`, `Opaque<"string">`, `Boolean`, etc.
- **Number Formats**: Hex (`0x1234`), Binary (`0b1010`), Octal (`0o777`), Decimal
- **Comments**: Line (`//`) and block (`/* */`) comments
- **Auto-completion**: Brackets, quotes, and smart pairing

## 🔧 Integration with create-midnight-app

The IDE seamlessly integrates with your create-midnight-app npm package:

1. **Temporary Project Creation**: Uses `npx create-midnight-app` to create compilation environments
2. **Real Compilation**: Leverages your package's build system for authentic Compact compilation
3. **Function Discovery**: Automatically parses generated APIs to discover contract functions
4. **Error Reporting**: Provides detailed compilation errors with line numbers

## 📝 Example Usage

Write real Compact smart contracts:

```compact
pragma language_version 0.16;
import CompactStandardLibrary;

export ledger count: Counter;

export circuit increment(value: Uint<16>): [] {
  count.increment(value);
}

export circuit get_count(): Uint<64> {
  return count;
}
```

## 🛠️ Development

### Modular Architecture

The IDE follows a modular architecture pattern:

- **Monaco Configuration**: Separated into `client/src/monaco/compactLanguage.js`
- **Language Definition**: Extracted from official VS Code extension
- **Theming**: VS Code Dark+ compatible colors
- **Examples**: Reusable contract templates

### Adding New Features

1. **Syntax Rules**: Update `compactLanguage.js` tokenizer
2. **Theme Colors**: Modify `compactMidnightTheme` object
3. **Examples**: Add to `compactExamples` object
4. **Compiler Integration**: Extend `compact-compiler.js`

## 🎯 Powered By

- **Frontend**: React + Monaco Editor + Axios
- **Backend**: Node.js + Express + create-midnight-app
- **Syntax**: Official VS Code Compact extension rules
- **Compilation**: Your create-midnight-app package v2.1.7

## 📄 License

MIT License

---

**Built with ❤️ for the Midnight blockchain ecosystem** 🌙✨
