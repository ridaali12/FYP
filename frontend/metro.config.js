const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Add support for react-native-gesture-handler
  config.resolver = {
    'react-native-gesture-handler': 'react-native-gesture-handler',
  };

  // Ensure proper linking of gesture handler
  config.serializer = {
    getModules: false,
  serializer: null,
  };

  return config;
})();
