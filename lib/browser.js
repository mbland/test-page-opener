/* eslint-env browser */

import { createCoverageMap } from 'istanbul-lib-coverage'
import { OpenedPage } from './types'

/**
 * Returns the window and document from a browser-opened HTML file.
 *
 * As all modern browsers fully support JavaScript modules, there are no caveats
 * or restrictions on any module import features. There's no requirement that a
 * page that can open in the browser using this class needs to be compatible
 * with JsdomPageOpener. However, it's likely best to design pages to be
 * compatible with JsdomPageOpener as well.
 */
export default class BrowserPageOpener {
  #window
  #coverageKey

  constructor(window) {
    const covKey = getCoverageKey(window)

    this.#window = window
    this.#coverageKey = covKey

    // Unconditionally create a coverage object, even if not collecting
    // coverage. There's no harm in this, and it avoids a coverage gap for a
    // condition that, by definition, would never execute when collecting
    // coverage. We could use a directive to ignore that gap, but why bother.
    window[covKey] = createCoverageMap(window[covKey])
  }

  /**
   * Opens another page within a web browser.
   * @param {string} basePath - base path of the application under test
   * @param {string} pagePath - path to the HTML file relative to basePath
   * @returns {Promise<OpenedPage>} - object representing the opened page
   */
  async open(basePath, pagePath) {
    const w = this.#window.open(`${basePath}${pagePath}`)
    const close = () => {
      this.#window[this.#coverageKey].merge(w[this.#coverageKey])
      w.close()
    }

    return new Promise(resolve => {
      const listener = () => resolve({window: w, document: w.document, close})
      w.addEventListener('load', listener, {once: true})
    })
  }
}

/**
 * Default value returned by getCoverageKey()
 */
export const DEFAULT_COVERAGE_KEY = '__coverage__'

/**
 * Returns the key for the Istanbul coverage object within the global object
 *
 * Searches for a key that looks like `/_.*coverage_/i`, such as Istanbul's
 * default `__coverage__` or Vitest's `__VITEST_COVERAGE__`. If such a key
 * doesn't exist, will return DEFAULT_COVERAGE_KEY by default.
 * @param {(object|Window)} globalObj - the global object (globalThis or window)
 * @returns {string} - the key for the Istanbul coverage object
 */
export function getCoverageKey(globalObj) {
  const foundKey = Object.getOwnPropertyNames(globalObj)
    .find(n => /_.*coverage_/i.test(n))
  return foundKey || DEFAULT_COVERAGE_KEY
}
