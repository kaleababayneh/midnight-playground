# Compact Midnight IDE

A modern web-based IDE for the Compact Midnight Domain Specific Language (DSL). Write, compile, and execute Compact Midnight code directly in your browser with syntax highlighting, real-time compilation, and a beautiful dark theme interface.

## 🌙 Features

- **Modern Code Editor**: Powered by Monaco Editor (VS Code's editor engine)
- **Syntax Highlighting**: Custom syntax highlighting for Compact Midnight DSL
- **Real-time Compilation**: Compile and execute code with instant feedback
- **Error Handling**: Detailed error messages with line numbers
- **Variable Tracking**: View all variables and their values after execution
- **Built-in Functions**: Support for mathematical functions like `sqrt()` and `abs()`
- **Keyboard Shortcuts**: Press `Ctrl+Enter` to quickly run your code
- **Responsive Design**: Works on desktop and tablet devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this project
2. Install all dependencies:
   ```bash
   npm run install-all
   ```

3. Start the development servers:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

The IDE will be running with the frontend on port 3000 and the backend API on port 3001.

## 📝 Compact Midnight Language Reference

### Variable Declarations
```javascript
let x = 10
let name = "Hello World"
let pi = 3.14159
```

### Arithmetic Operations
```javascript
let sum = x + y
let difference = x - y
let product = x * y
let quotient = x / y
```

### Print Statements
```javascript
print "Hello, World!"
print x
print "The sum is: " + sum
```

### Built-in Functions
```javascript
print sqrt(16)    // Square root: 4
print abs(-5)     // Absolute value: 5
```

### Comments
```javascript
// This is a line comment
# This is also a comment
let x = 10  // Comments can be at the end of lines
```

### Variable Reassignment
```javascript
let x = 5
x = x + 10    // x is now 15
print x
```

## 🏗️ Project Structure

```
compact-midnight-ide/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js         # Main IDE component
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Styles
│   └── package.json
├── server/                 # Node.js backend
│   ├── index.js           # Express server
│   ├── compiler.js        # DSL compiler/interpreter
│   └── package.json
├── package.json           # Root package.json for scripts
└── README.md
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend
- `npm run build` - Build the frontend for production

### API Endpoints

- `POST /api/compile` - Compile and execute Compact Midnight code
- `GET /api/health` - Health check endpoint

### Example API Request

```javascript
POST /api/compile
Content-Type: application/json

{
  "code": "let x = 10\nprint x"
}
```

### Example API Response

```javascript
{
  "success": true,
  "result": {
    "output": "x = 10\nOUTPUT: 10",
    "variables": {
      "x": 10
    },
    "executionTime": 1703123456789
  }
}
```

## 🎨 Customization

### Adding New Language Features

1. **Extend the Compiler**: Modify `server/compiler.js` to add new syntax patterns
2. **Update Syntax Highlighting**: Add new keywords to the Monaco tokenizer in `client/src/App.js`
3. **Add Built-in Functions**: Extend the `handleFunctionCall` method in the compiler

### Theming

The IDE uses a custom dark theme called "compact-midnight-theme". You can modify the colors and styling in:
- `client/src/App.js` (Monaco editor theme)
- `client/src/index.css` (UI components)

## 🐛 Error Handling

The IDE provides comprehensive error handling:

- **Syntax Errors**: Detailed messages with line numbers
- **Runtime Errors**: Variable not found, invalid operations
- **Network Errors**: Connection issues between frontend and backend

## 🚀 Deployment

### Frontend (Static Hosting)

1. Build the frontend:
   ```bash
   cd client && npm run build
   ```

2. Deploy the `build/` folder to any static hosting service (Netlify, Vercel, etc.)

### Backend (Node.js Hosting)

1. Deploy the `server/` folder to any Node.js hosting service (Heroku, Railway, etc.)
2. Set the `PORT` environment variable if required
3. Update the frontend's API base URL if needed

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Monaco Editor for the excellent code editor
- React and Node.js communities
- Inspired by modern IDE interfaces like VS Code

---

Happy coding with Compact Midnight! 🌙✨
