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
            include: ['test/integration/*.spec.{ts,tsx}', 'test/integration/firestore/**/*.spec.{ts,tsx}'],
            environment: 'jsdom',
          },
        },
      ],
    },
  }),
)
