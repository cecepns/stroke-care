const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  server: {
    port: 8081,
    // Fix WebSocket connection issues
    enhanceMiddleware: (middleware, server) => {
      return (req, res, next) => {
        // Handle WebSocket upgrade requests
        if (req.headers.upgrade === 'websocket') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        return middleware(req, res, next);
      };
    },
  },
  // Enable better debugging
  watchFolders: [],
  maxWorkers: 2,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
