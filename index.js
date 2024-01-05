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
  #basePath
  #impl
  #opened

  constructor(basePath, impl) {
    if (!basePath.startsWith('/') || !basePath.endsWith('/')) {
      const msg = 'basePath should start with \'/\' and end with \'/\''
      throw new Error(`${msg}, got: "${basePath}"`)
    }
    this.#basePath = basePath
    this.#impl = impl
    this.#opened = []
  }

  /**
   * Creates a new PageOpener instance.
   *
   * Prefer this to calling `new PageOpener`.
   * @param {string} basePath - base path of the application under test
   * @returns {PageOpener} - a new PageOpener initialized to open pages in the
   *   current test environment, either via Jsdom or the browser
   */
  static async create(basePath) {
    const impl = globalThis.window ?
      new BrowserPageOpener(globalThis.window) :
      new JsdomPageOpener(await import('jsdom'))
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
