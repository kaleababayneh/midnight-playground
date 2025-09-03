module.exports = {
  devServer: {
    allowedHosts: 'all',
    client: {
      webSocketURL: 'ws://localhost:3000/ws',
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Disable WebAssembly to avoid CSP issues
      webpackConfig.experiments = {
        ...webpackConfig.experiments,
        asyncWebAssembly: false,
        syncWebAssembly: false,
      };
      
      // Add fallbacks for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
      };
      
      return webpackConfig;
    },
  },
};
