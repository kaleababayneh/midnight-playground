# 🌙 Compact Midnight IDE

> A modern web-based VS Code-like IDE for Compact Midnight blockchain smart contracts

> ⚠️ This project is not production ready yet.

![Compact Midnight IDE](https://img.shields.io/badge/Midnight-Compact%20IDE-purple?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)
[![Live Demo](https://img.shields.io/badge/🚀-Live%20Demo-brightgreen?style=for-the-badge)](https://midnight-playground-one.vercel.app/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge)](LICENSE)

## ✨ Features

Write, compile, and execute **real Compact code** directly in your browser with:

- 🎨 **VS Code-like interface** with official syntax highlighting
- ⚡ **Real-time compilation** using midnight compiler backend integration  
- 🌙 **Beautiful dark theme** optimized for long coding sessions
- 📝 **Dual-pane editor** for contracts (.compact) and witnesses (.ts)
- 🔨 **One-click compilation** and building
- 📚 **Built-in examples** to get you started quickly
- 🚀 **Zero installation** required

## 🎯 Vision

This IDE aims to be the **Remix IDE for Midnight** ([remix.ethereum.org](https://remix.ethereum.org)) - enabling smart contract development without complex local setup or configuration.

## 🌐 Live Demo

**🔗 Start coding immediately**: [https://midnight-playground-one.vercel.app/](https://midnight-playground-one.vercel.app/)

⚠️ **Please compile the contract before building**

## 🗺️ Roadmap

- ✅ Contract compilation and building
- 🔄 **Coming Soon**: Wallet connection integration
- 🔄 **Coming Soon**: Testnet contract deployment
- 🔄 **Coming Soon**: Interactive function execution

## 🏠 Local Development

While the IDE is deployed on cloud infrastructure, you can run it locally for development: 
### 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### 🛠️ Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/kaleababayneh/midnight-playground
cd midnight-playground
git switch local  # Switch to the local development branch
```

2. **Install dependencies**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

3. **Start development servers**
```bash
# Terminal 1: Start the backend server
cd server && npm start

# Terminal 2: Start the frontend development server  
cd client && npm start
```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Start building amazing Compact smart contracts! 🚀

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Built with ❤️ by [@0xkaleab](https://github.com/kaleababayneh)

---

⭐ **Star this repo** if you find it helpful!