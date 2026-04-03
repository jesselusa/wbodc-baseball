/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
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
