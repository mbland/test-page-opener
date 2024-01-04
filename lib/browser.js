/* eslint-env browser */

import libCoverage from 'istanbul-lib-coverage'
import { OpenedPage } from './types'

export default class BrowserPageOpener {
  #window
  #coverageKey

  constructor(window) {
    this.#window = window
    this.#coverageKey = BrowserPageOpener.getCoverageKey(window)
  }

  static getCoverageKey(globalObj) {
    const foundKey = Object.getOwnPropertyNames(globalObj)
      .find(n => /_+.*coverage_+/i.test(n))
    return foundKey || '__coverage__'
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
      this.#mergeCoverageStore(w)
      w.close()
    }
    return new Promise(resolve => {
      const listener = () => {
        resolve({window: w, document: w.document, close})
      }
      w.addEventListener('load', listener, {once: true})
    })
  }

  // This is very specific to the Istanbul coverage provider.
  #mergeCoverageStore(openedWindow) {
    const covKey = this.#coverageKey
    const thisCov = this.#window[covKey]
    const combinedCov = libCoverage.createCoverageMap(thisCov)

    combinedCov.merge(openedWindow[covKey])
    this.#window[covKey] = combinedCov.toJSON()
  }
}
