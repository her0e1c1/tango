import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { createReactCompilerPlugin } from './reactCompiler'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [createReactCompilerPlugin(), tsconfigPaths()],
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
