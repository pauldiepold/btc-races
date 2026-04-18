import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~~': resolve(__dirname),
      '~~/': resolve(__dirname, './'),
    },
  },
  test: {
    include: ['test/unit/**/*.{test,spec}.ts'],
    environment: 'node',
  },
})
