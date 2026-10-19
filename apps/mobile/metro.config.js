// Expo's Metro config understands npm workspaces, so the shared packages in ../../packages are
// resolved and transpiled from source.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
