// @ts-nocheck
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config.js'

export default mergeConfig(baseConfig, defineConfig({
  test: {
    outputFile: 'TESTS-TestSuites-browser.xml',
    coverage: {
      provider: 'istanbul',
      reportsDirectory: 'coverage-browser'
    },
    browser: {
      enabled: true,
      headless: true,
      name: 'chrome'
    }
  }
}))
