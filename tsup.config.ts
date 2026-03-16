import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: ['esm'],
  target: 'node18',
  banner: {
    js: '#!/usr/bin/env node',
  },
  bundle: true,
  clean: true,
  outDir: 'dist',
  // Keep Node.js built-ins external so CJS dynamic require works
  external: [
    'os', 'path', 'fs', 'fs/promises', 'node:os', 'node:path', 'node:fs',
    'node:fs/promises', 'node:child_process', 'node:util', 'node:stream',
    'node:events', 'node:buffer', 'node:process', 'node:url',
    'fast-glob',
  ],
  treeshake: true,
})
