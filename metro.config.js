const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer browser/react-native fields so Metro doesn't pick Node-specific builds
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;