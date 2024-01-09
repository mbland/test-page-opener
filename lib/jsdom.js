/* eslint-env browser */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { OpenedPage } from './types.js'

/**
 * @typedef {object} JSDOM - simulated jsdom.JSDOM
 * @property {Function} fromFile - simulated JSDOM.fromFile
 */

/**
 * Returns window and document objects from a jsdom-parsed HTML file.
 *
 * Based on hints from:
 * - <https://oliverjam.es/articles/frontend-testing-node-jsdom>
 *
 * It will import modules from `<script type="module">` elements with a `src`
 * attribute, but not those with inline code. It does this by calling dynamic
 * `import()` on the `src` paths:
 *
 * - <https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import>
 *
 * This is because jsdom currently parses, but doesn't execute,
 * `<script type="module">` elements:
 *
 * - <https://github.com/jsdom/jsdom/issues/2475>
 *
 * Once that issue is resolved, the jsdom module loading implementation will
 * supplant this class's current module loading implementation, described below.
 *
 * ### Timing of `<script type="module">` execution
 *
 * Technically, imported modules should execute similarly to `<script defer>`
 * and execute before the `DOMContentLoaded` event.
 *
 * - <https://developer.mozilla.org/docs/Web/HTML/Element/script#module>
 *
 * However, this implementation registers a `load` event handler that collects
 * `src` paths and waits for the dynamic `import()` of each path to resolve. It
 * then fires the `DOMContentLoaded` and `load` events again, enabling modules
 * that register listeners for those events to behave as expected.
 *
 * ### More detail...
 *
 * `DOMContentLoaded` and `load` events from `JSDOM.fromFile()` always fire
 * before dynamic module imports finish resolving. In some cases,
 * `DOMContentLoaded` fires even before `JSDOM.fromFile()` resolves.
 *
 * If, immediately after JSDOM.fromFile() returns, `document.readyState` is
 * `loading`, `DOMContentLoaded` has yet to fire. If it's `interactive`,
 * `DOMContentLoaded` has already fired, and `load` is about to fire.
 *
 * - <https://developer.mozilla.org/docs/Web/API/Document/readyState>
 *
 * The `test/event-ordering-demo/main.js` demo script from this package shows
 * this behavior in action. See that file's comments for details.
 * @see https://github.com/jsdom/jsdom
 */
export default class JsdomPageOpener {
  #JSDOM

  /**
   * Creates a JsdomPageOpener from a dynamically imported jsdom module
   * @param {object} jsdom - dynamically imported jsdom module
   * @param {JSDOM} jsdom.JSDOM - JSDOM class from the jsdom module
   */
  constructor({ JSDOM }) {
    this.#JSDOM = JSDOM
  }

  /**
   * Opens a page using jsdom.
   * @param {string} _ - ignored
   * @param {string} pagePath - path to the HTML file to load
   * @returns {Promise<OpenedPage>} - object representing the opened page
   * @throws {Error} if opening page failed
   */
  async open(_, pagePath) {
    const { window } = await this.#JSDOM.fromFile(
      pagePath, {resources: 'usable', runScripts: 'dangerously'}
    )
    const document = window.document

    try {
      await this.#importModules(window, document)
    } catch (err) {
      throw new Error(`opening ${pagePath}`, { cause: err })
    }
    return { window, document, close() { window.close() } }
  }

  /**
   * Dynamically imports ECMAScript modules.
   * @param {Window} window - the jsdom window object
   * @param {Document} document - the jsdom window.document object
   * @returns {Promise<void>} - resolves after importing all ECMAScript modules
   * @throws if importing any ECMAScript modules fails
   */
  #importModules(window, document) {
    return new Promise((resolve, reject) => {
      const importModulesOnEvent = async () => {
        // The jsdom docs advise against setting global properties, but we don't
        // really have another option given any module may access window and/or
        // document.
        //
        // (I tried to explore invoking ES modules properly inside the jsdom,
        // and realized that way lies madness. At least, I couldn't yet figure
        // out how to access the Vite/Vitest module path resolver or Rollup
        // plugins. Then there's the matter of importmaps. I may still pick at
        // it, but staring directly at it right now isn't productive.)
        //
        // Also, unless the module takes care to close over window or document,
        // they may still reference the global.window and global.document
        // attributes. This isn't a common cause for concern in a browser, but
        // resetting these global properties before a jsdom listener fires can
        // cause it to error. This, in turn, can potentially cause a test to
        // hang or fail.
        //
        // This is why we keep global.window and global.document set until
        // the load event handler below fires, after the manually dispatched
        // load event. This is best-effort, of course, as we can't know if any
        // async ops dispatched by those listeners will register a 'load' event
        // later. In that case, window and document may be undefined for those
        // listeners.
        //
        // The best defense against this problem would be to design the app to
        // register closures over window and document, or specific document
        // elements. That would ensure they remain defined even after we remove
        // window and document from globalThis.
        const { window: origWindow, document: origDocument } = globalThis

        /** @param {Function} done - called after restoring original globals */
        const resetGlobals = done => {
          globalThis.document = origDocument
          globalThis.window = origWindow
          done()
        }

        // @ts-expect-error
        globalThis.window = window
        globalThis.document = document

        try { await importModules(document) }
        catch (err) { return resetGlobals(() => {reject(err)}) }

        // Manually firing DOMContentLoaded again after loading modules
        // approximates the requirement that modules execute before
        // DOMContentLoaded. This means that the modules can register
        // DOMContentLoaded event listeners and have them fire here.
        //
        // We eventually fire the 'load' event again too for the same reason.
        const Event = globalThis.window.Event
        document.dispatchEvent(
          new Event('DOMContentLoaded', {bubbles: true, cancelable: false})
        )

        // Register a 'load' listener that deletes the global window and
        // document variables. Because it's registered after any
        // DOMContentLoaded listeners have fired, it should execute after any
        // other 'load' listeners registered by any module code.
        window.addEventListener(
          'load', () => {resetGlobals(resolve)}, {once: true}
        )
        window.dispatchEvent(
          new Event('load', {bubbles: false, cancelable: false})
        )
      }
      window.addEventListener('load', importModulesOnEvent, {once: true})
    })
  }
}

/**
 * Imports modules from `<script type="module">` elements parsed by jsdom.
 *
 * Only works with the `src` attribute; it will not execute inline code.
 * @param {Document} doc - the jsdom window.document object
 * @returns {Promise<void[]>} - resolves after importing all modules in doc
 * @throws if any module import fails
 */
function importModules(doc) {
  /** @type {HTMLScriptElement[]} */
  const modules = Array.from(doc.querySelectorAll('script[type="module"]'))
  return Promise.all(modules.filter(m => m.src).map(async m => {
    try { await import(m.src) }
    catch (err) { throw new Error(`importing ${m.src}`, { cause: err }) }
  }))
}
