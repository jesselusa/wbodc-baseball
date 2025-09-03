/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Suppress punycode deprecation warnings
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        punycode: 'punycode/',
      };
    }
    return config;
  },
};

// Suppress Node.js deprecation warnings for punycode (DEP0040)
if (typeof process !== 'undefined') {
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = function(warning, type, code, ...args) {
    // Suppress punycode deprecation warning (DEP0040)
    if (code === 'DEP0040') {
      return;
    }
    return originalEmitWarning.call(process, warning, type, code, ...args);
  };
}

module.exports = nextConfig;
