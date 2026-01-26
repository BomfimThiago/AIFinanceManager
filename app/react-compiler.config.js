const ReactCompilerConfig = {
  // Source directories to optimize
  sources: (filename) => {
    return filename.indexOf('node_modules') === -1;
  },

  // Enable more aggressive optimizations
  enableReactiveScopesInHIR: true,

  // Optimize components for better performance
  enableOptimizeComponents: true,

  // Target React Native environment
  environment: {
    enableTreatFunctionDepsAsConditional: false,
  },

  // Development mode configuration
  logger: {
    enableLogCOMPILATION: process.env.NODE_ENV === 'development',
    enableLogDEBUG: process.env.NODE_ENV === 'development',
  },

  // Disable for specific patterns that might cause issues
  suppressWarnings: [
    'InvalidReactAPI'
  ],
};

module.exports = ReactCompilerConfig;