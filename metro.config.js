const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for module compatibility - include .cjs for nanoid
config.resolver.sourceExts = ['mjs', 'cjs', 'js', 'json', 'ts', 'tsx'];
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');

// Ensure proper module resolution
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'tslib': require.resolve('tslib'),
};

module.exports = config;
