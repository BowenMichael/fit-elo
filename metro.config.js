// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ─────────────────────────────────────────────────────────────────────────────
// Fix: "Cannot use 'import.meta' outside a module" in production web builds.
//
// Root cause: Metro sets context.isESMImport=true when the importing file uses
// ES `import` syntax, resolving the "import" condition in package exports maps
// which picks up ESM/`.mjs` builds using `import.meta`.
//
// Fix: Use a custom resolveRequest to force CJS resolution for known packages.
// ─────────────────────────────────────────────────────────────────────────────

const forceCjsPackages = {
  'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
  'zustand/middleware/immer': path.resolve(__dirname, 'node_modules/zustand/middleware/immer.js'),
};

const originalResolver = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [pkg, cjsPath] of Object.entries(forceCjsPackages)) {
    if (moduleName === pkg) {
      return { type: 'sourceFile', filePath: cjsPath };
    }
  }

  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
