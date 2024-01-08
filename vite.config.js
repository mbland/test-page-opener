// @ts-nocheck
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import fs from 'node:fs'
import os from 'node:os'

const ARM64_LINUX_WARNING = [
  '',
  'WARNING:',
  '-------',
  'Neither Google Chrome nor Chrome for Testing are available for arm64 Linux.',
  'Also, the snap versions of Chromium, Chromedriver, and Firefox are not',
  'controllable by the webdriverio npm. For these reasons, you will need to',
  'install non-snap versions of Chromium and/or Firefox to run the browser',
  'tests.',
  '',
  'Some guidance for doing so on Ubuntu is available at:',
  '- https://askubuntu.com/questions/1179273/how-to-remove-snap-completely-without-losing-the-chromium-browser/1206502#1206502',
  '- https://www.omgubuntu.co.uk/2022/04/how-to-install-firefox-deb-apt-ubuntu-22-04',
  '',
  'Note that this may also require upgrading to at least Ubuntu 23.10, as it',
  'will have more recent dependency updates that Chromium depends upon.',
  ''
]

/**
 * Configures browser tests to use Chromium on arm64 Linux
 *
 * Emits a warning and some suggestions if the system is arm64 Linux and
 * /usr/bin/chromium is missing.
 *
 * Returns undefined if the system isn't arm64 Linux or if /usr/bin/chromium
 * is missing.
 * @returns {object | undefined} Chromium providerOptions or undefined
 */
function getProviderOptions(){
  if (os.arch() !== 'arm64' || os.platform() !== 'linux') return

  if (fs.existsSync('/usr/bin/chromium')) {
    return {
      capabilities: {
        browserName: 'chromium',
        'wdio:chromedriverOptions': {
          binary: '/usr/bin/chromedriver'
        },
        'goog:chromeOptions': {
          binary: '/usr/bin/chromium'
        }
      }
    }
  }
  console.warn(ARM64_LINUX_WARNING.join('\n'))
}

export default defineConfig({
  base: '/basedir/',
  define: {
    STRCALC_BACKEND: JSON.stringify(process.env.STRCALC_BACKEND)
  },
  test: {
    coverage: {
      reportsDirectory: 'coverage',
      exclude: [...configDefaults.coverage.exclude, 'jsdoc', 'out']
    },
    browser: {
      name: 'chrome',
      providerOptions: getProviderOptions()
    }
  }
})
