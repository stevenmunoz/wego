import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

/**
 * Vite plugin to generate version.json and set VITE_APP_VERSION
 * - Generates a unique version hash at build time
 * - Writes version.json to dist/ after build
 * - Injects VITE_APP_VERSION into the app
 */
function versionPlugin(): Plugin {
  let version = 'dev';

  return {
    name: 'version-plugin',
    config(config, { command }) {
      // Only generate on build
      if (command === 'build') {
        let commitHash = 'unknown';
        try {
          commitHash = execSync('git rev-parse --short HEAD').toString().trim();
        } catch (e) {
          console.warn('[version-plugin] Could not get git commit hash');
        }

        version = `${commitHash}-${Date.now()}`;

        // Inject into env
        process.env.VITE_APP_VERSION = version;

        return {
          define: {
            'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
          },
        };
      }
    },
    writeBundle() {
      // Generate version.json after build
      let commitHash = 'unknown';
      try {
        commitHash = execSync('git rev-parse --short HEAD').toString().trim();
      } catch (e) {
        console.warn('[version-plugin] Could not get git commit hash');
      }

      const buildTime = new Date().toISOString();

      const versionInfo = {
        version,
        buildTime,
        commitHash,
      };

      writeFileSync(
        path.resolve(__dirname, 'dist/version.json'),
        JSON.stringify(versionInfo, null, 2)
      );

      console.log(`[version-plugin] Generated version.json: ${version}`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), versionPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/core': path.resolve(__dirname, './src/core'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'src/tests/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
});
