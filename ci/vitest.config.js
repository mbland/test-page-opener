import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from '../vite.config.js'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    outputFile: 'TESTS-TestSuites-jsdom.xml',
    reporters: [ 'junit', 'default' ],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: [ 'text', 'lcovonly' ],
      reportsDirectory: 'coverage-jsdom'
    }
  }
}))
