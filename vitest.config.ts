import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          'src/**/*.spec.{ts,tsx}',
          'src/**/*.stories.{ts,tsx}',
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
            setupFiles: ['./test/setup.ts'],
            include: ['src/**/*.spec.{ts,tsx}', '*.spec.{ts,tsx}'],
            environment: 'jsdom',
          },
        },
        {
          extends: true,
          test: {
            name: 'integration',
            globals: true,
            setupFiles: ['./test/setup.ts'],
            include: ['test/integration/**/*.spec.{ts,tsx}'],
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
              storybookScript: 'npm run storybook -- --no-open',
            }),
          ],
          test: {
            name: 'storybook',
            attachmentsDir: 'test-results/storybook/attachments',
            browser: {
              enabled: true,
              provider: playwright({ contextOptions: { colorScheme: 'light', reducedMotion: 'no-preference' } }),
              headless: true,
              instances: [{ browser: 'chromium' }],
              screenshotFailures: true,
              screenshotDirectory: 'test-results/storybook',
            },
          },
        },
      ],
    },
  }),
)
