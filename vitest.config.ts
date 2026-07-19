import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { createReactCompilerPlugin } from './reactCompiler'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [createReactCompilerPlugin(), tsconfigPaths()],
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
  },
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/shared/storybook/**',
      ],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportOnFailure: true,
      thresholds: {
        statements: 86,
        branches: 78,
        functions: 85,
        lines: 92,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        optimizeDeps: {
          include: ['storybook/test'],
        },
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'npm run storybook -- --no-open',
          }),
        ],
        test: {
          name: 'storybook',
          attachmentsDir: 'test-results/storybook/attachments',
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: 'chromium' }],
            screenshotFailures: true,
            screenshotDirectory: 'test-results/storybook',
          },
        },
      },
    ],
  },
})
