import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config'

export default mergeConfig(baseConfig, defineConfig({
  test: {
    outputFile: 'TESTS-TestSuites-browser.xml',
    coverage: {
      reportsDirectory: 'coverage-browser'
    },
    browser: {
      enabled: true,
      headless: true,
      name: 'chrome'
    }
  }
}))
