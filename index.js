/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import BrowserPageOpener from './lib/browser.js'
import JsdomPageOpener from './lib/jsdom.js'
import { OpenedPage } from './lib/types.js'

/**
 * Enables tests to open an application's own page URLs both in the browser and
 * in Node.js using jsdom.
 *
 * Usage:
 *
 * ```js
 * import { afterEach, beforeAll, describe, expect, test } from 'vitest'
 * import TestPageOpener from 'test-page-opener'
 *
 * describe('TestPageOpener', () => {
 *   let opener
 *
 *   beforeAll(async () => {opener = await TestPageOpener.create('/basedir/')})
 *   afterEach(() => opener.closeAll())
 *
 *   test('loads page with module successfully', async () => {
 *     const { document } = await opener.open('path/to/index.html')
 *     const appElem = document.querySelector('#app')
 *
 *     expect(appElem).not.toBeNull()
 *     expect(appElem.textContent).toContain('Hello, World!')
 *   })
 * })
 * ```
 */
export default class TestPageOpener {
  static #isConstructing = false

  #basePath
  #impl
  /** @type {OpenedPage[]} */
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
    if (!TestPageOpener.#isConstructing) {
      throw new Error('use TestPageOpener.create() instead')
    }
    if (!basePath.startsWith('/') || !basePath.endsWith('/')) {
      const msg = 'basePath should start with \'/\' and end with \'/\''
      throw new Error(`${msg}, got: "${basePath}"`)
    }
    this.#basePath = basePath
    this.#impl = impl
    this.#opened = []
    TestPageOpener.#isConstructing = false
  }

  /**
   * Creates a new TestPageOpener instance.
   *
   * Call this once for each test class or `describe()` block, e.g.:
   *
   * ```js
   * let opener
   * beforeAll(async () => {opener = await TestPageOpener.create('/basedir/')})
   * ```
   * @param {string} basePath - base path of the application under test; must
   *   start with '/' and end with '/'
   * @returns {Promise<TestPageOpener>} - a new TestPageOpener initialized to
   *   open pages in the current test environment, either via jsdom or the
   *   browser
   */
  static async create(basePath) {
    const impl = globalThis.window ?
      new BrowserPageOpener(globalThis.window) :
      new JsdomPageOpener(await import('jsdom'))

    TestPageOpener.#isConstructing = true
    return new TestPageOpener(basePath, impl)
  }

  /**
   * Opens a page using the current environment's implementation.
   *
   * The returned object contains the opened `window`, the fully loaded
   * `document`, and a `close()` function for closing the window properly.
   * Usually you will pull the `document` from the return value and call
   * `opener.closeAll()` from `afterEach()`, e.g.:
   *
   * ```js
   * const { document } = await opener.open('path/to/index.html')
   * ```
   * @param {string} pagePath - path to the HTML file relative to the basePath
   *   specified during `TestPageOpener.create()`
   * @returns {Promise<OpenedPage>} - object representing the opened page
   * @throws {Error} if pagePath is malformed or opening page failed
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
   * Closes the window object for all currently opened pages.
   *
   * Call this from the teardown function after each test case, e.g.:
   *
   * ```js
   * afterEach(() => opener.closeAll())
   * ```
   */
  closeAll() {
    this.#opened.forEach(p => p.close())
    this.#opened = []
  }
}
