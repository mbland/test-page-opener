/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import BrowserPageOpener from './lib/browser'
import JsdomPageOpener from './lib/jsdom'
import { OpenedPage } from './lib/types'

/**
 * Enables tests to open an application's own page URLs both in the browser and
 * in Node.js using jsdom.
 */
export class PageOpener {
  static #isConstructing = false

  #basePath
  #impl
  #opened

  /**
   * Based on the private constructor idiom.
   * @see https://developer.mozilla.org/docs/Web/JavaScript/Reference/Classes/Private_properties#simulating_private_constructors
   * @access private
   * @param {string} basePath - base path of the application under test
   * @param {(BrowserPageOpener|JsdomPageOpener)} impl - either a browser or
   *   jsdom implementation for opening HTML pages
   */
  constructor(basePath, impl) {
    if (!PageOpener.#isConstructing) {
      throw new Error('use PageOpener.create() instead')
    }
    if (!basePath.startsWith('/') || !basePath.endsWith('/')) {
      const msg = 'basePath should start with \'/\' and end with \'/\''
      throw new Error(`${msg}, got: "${basePath}"`)
    }
    this.#basePath = basePath
    this.#impl = impl
    this.#opened = []
    PageOpener.#isConstructing = false
  }

  /**
   * Creates a new PageOpener instance.
   *
   * Call this once for each test class or `describe()` block, e.g.:
   *
   * ```js
   * let opener
   * beforeAll(async () => opener = await PageOpener.create('/basedir/'))
   * ```
   * @param {string} basePath - base path of the application under test; must
   *   start with '/' and end with '/'
   * @returns {PageOpener} - a new PageOpener initialized to open pages in the
   *   current test environment, either via Jsdom or the browser
   */
  static async create(basePath) {
    const impl = globalThis.window ?
      new BrowserPageOpener(globalThis.window) :
      new JsdomPageOpener(await import('jsdom'))

    PageOpener.#isConstructing = true
    return new PageOpener(basePath, impl)
  }

  /**
   * Opens a page using the current environment's implementation.
   * @param {string} pagePath - path to the HTML file relative to basePath
   * @returns {Promise<OpenedPage>} - object representing the opened page
   */
  async open(pagePath) {
    if (pagePath.startsWith('/')) {
      const msg = 'page path shouldn\'t start with \'/\''
      throw new Error(`${msg}, got: "${pagePath}"`)
    }

    const page = await this.#impl.open(this.#basePath, pagePath)
    this.#opened.push(page)
    return page
  }

  /**
   * Closes the window object for all currently opened pages
   */
  closeAll() {
    this.#opened.forEach(p => p.close())
    this.#opened = []
  }
}
