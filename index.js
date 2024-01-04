/* eslint-env browser, node */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * Return value from PageOpener.open()
 * @typedef OpenedPage
 * @property {Window} window - Window object for the opened page
 * @property {Document} document - Document object parsed from the opened page
 * @property {Function} close - closes the page
 */

/**
 * Enables tests to open an application's own page URLs both in the browser and
 * in Node.js using jsdom.
 */
export class PageOpener {
  static #impl

  #basePath
  #opened

  constructor(basePath) {
    if (!basePath.startsWith('/') || !basePath.endsWith('/')) {
      const msg = 'basePath should start with \'/\' and end with \'/\''
      throw new Error(`${msg}, got: "${basePath}"`)
    }
    this.#basePath = basePath
    this.#opened = []
  }

  async open(pagePath) {
    if (pagePath.startsWith('/')) {
      const msg = 'page path should not start with \'/\''
      throw new Error(`${msg}, got: "${pagePath}"`)
    }

    const impl = await PageOpener.getImpl()
    const page = await impl.open(this.#basePath, pagePath)

    this.#opened.push(page)
    return page
  }

  closeAll() {
    this.#opened.forEach(p => p.close())
    this.#opened = []
  }

  static async getImpl() {
    if (this.#impl) {
      return this.#impl
    }

    if (globalThis.window) {
      return this.#impl = new BrowserPageOpener(globalThis.window)
    }

    return this.#impl = new JsdomPageOpener(await import('jsdom'))
  }
}

class BrowserPageOpener {
  #window

  constructor(window) {
    this.#window = window
  }

  // Opens a page and returns {window, document, close()} using the browser.
  async open(basePath, pagePath) {
    const w = this.#window.open(`${basePath}${pagePath}`)
    return new Promise(resolve => {
      const listener = () => {
        this.#setCoverageStore(w)
        resolve({window: w, document: w.document, close() {w.close()}})
      }
      w.addEventListener('load', listener, {once: true})
    })
  }

  // This is an egregious, brittle hack that's very specific to Vitest's
  // Istanbul coverage provider. It also only collects coverage from the last
  // page opened; it loses coverage information for all other pages.
  //
  // But as long as a test function calls BrowserPageOpener.load() only once, it
  // should work pretty well.
  #setCoverageStore(openedWindow) {
    const COVERAGE_STORE_KEY = '__VITEST_COVERAGE__'

    if (COVERAGE_STORE_KEY in openedWindow) {
      this.#window[COVERAGE_STORE_KEY] = openedWindow[COVERAGE_STORE_KEY]
    }
  }
}

/**
 * Returns window and document objects from a jsdom-parsed HTML file.
 *
 * It will import modules from `<script type="module">` elements with a `src`
 * attribute, but not those with inline code.
 *
 * Based on hints from:
 * - https://oliverjam.es/articles/frontend-testing-node-jsdom
 */
class JsdomPageOpener {
  #JSDOM

  constructor({ JSDOM }) {
    this.#JSDOM = JSDOM
  }

  /**
   * Opens a page using jsdom.
   *
   * Imports modules from `<script type="module">` elements with a `src`
   * attribute, but does not execute such elements with inline code. This is
   * because jsdom currently parses, but doesn't execute,
   * `<script type="module">` elements:
   *
   * - https://github.com/jsdom/jsdom/issues/2475
   *
   * Once that issue is resolved, the explicit module loading behavior can
   * be deleted from this implementation.
   *
   * ### Note on the timing of `<script type="module">` execution
   *
   * Technically, the imported modules should execute similarly to
   * `<script defer>` and execute before the "DOMContentLoaded" event.
   * However, modules imported with this function will execute _on_ a simulated
   * "DOMContentLoaded" event within a "load" event handler. This is because the
   * original jsdom "DOMContentLoaded" and "load" events will fire before the
   * the dynamic import() calls resolve.
   *
   * The "load" event listener waits for the dynamic `import()` operations, then
   * manually fires the "DOMContentLoaded" and "load" again. This enables (most)
   * modules that register listeners for those events to behave as expected in
   * jsdom based tests.
   * @param {string} _ - ignored
   * @param {string} pagePath - path to the HTML file to load
   * @returns {Promise<OpenedPage>} - object representing the opened page
   */
  async open(_, pagePath) {
    const { window } = await this.#JSDOM.fromFile(
      pagePath, {resources: 'usable', runScripts: 'dangerously'}
    )
    const document = window.document

    // Originally this function returned the result object directly, not
    // wrapped in the `done` Promise. This was because, for the original
    // implementation, the 'load' event fired before the modules were imported.
    // Or so I thought...
    //
    // console.log() statements added in the appropriate places revealed
    // this pattern (the second 'stdout' doesn't always appear):
    //
    //   stdout | main.test.js > String Calculator UI > initial state > ...
    //   DOMContentLoaded
    //   LOADED
    //   stdout | main.test.js > String Calculator UI > initial state > ...
    //   INITIALIZED
    //   IMPORTED
    //   CLOSED
    //
    // However, it turned out that in watch mode, this held true only for the
    // _first_ test run. On every subsequent run, the entire test method would
    // finish before the 'load' event fired. This caused dom.window.close() to
    // throw an AbortError before the stylesheet from index.html finished
    // loading. This pattern appeared consistently on each run after the first:
    //
    //   INITIALIZED
    //   IMPORTED
    //   CLOSED
    //   Error: Could not load link: "file:///.../style.css"
    //   [...snip...]
    //     isAbortError: true
    //
    // What's interesting is that by making the close() function in the result
    // object a noop, avoiding the error, the pattern looked like:
    //
    // First run:
    //   DOMContentLoaded
    //   LOADED
    //   INITIALIZED
    //   IMPORTED
    //   CLOSED
    //
    // Most subsequent runs:
    //   INITIALIZED
    //   IMPORTED
    //   CLOSED
    //
    // Some subsequent runs (note the "stdout | unknown test" output):
    //   stdout | main.test.js > String Calculator UI > initial state > ...
    //   INITIALIZED
    //   IMPORTED
    //   CLOSED
    //   stdout | unknown test
    //   DOMContentLoaded
    //   LOADED
    //
    // After updating the implementation to wait for 'load', but not
    // 'DOMContentLoaded', the output looked like the following:
    //
    // First run:
    //   DOMContentLoaded
    //   LOADED
    //   INITIALIZED
    //   IMPORTED
    //   CLOSED
    //
    // Subsequent runs:
    //   INITIALIZED
    //   IMPORTED
    //   DOMContentLoaded
    //   LOADED
    //   CLOSED
    //
    // For consistency's sake, it seemed prudent to wait for DOMContentLoaded to
    // fire before calling importModules(). The first attempt didn't fire
    // DOMContentLoaded again. This broke from the <script defer>-like behavior
    // a bit, but made each run more consistent. The output from that
    // implementation looked like this on every run:
    //
    //   DOMContentLoaded
    //   LOADED
    //   INITIALIZED
    //   IMPORTED
    //   CLOSED
    //
    // I eventually decided to fire the DOMContentLoaded and load events
    // again in #importModulesPromise. This enables modules to register
    // listeners for those events, approximating the expectation that modules
    // will run before DOMContentLoaded.
    //
    // Adding some slightly more descriptive output results in:
    //
    //   AWAITING MODULE IMPORTS
    //   DOMContentLoaded
    //   IMPORT BEGIN
    //   LOADED
    //   IMPORTING main.js
    //   IMPORT END
    //   INITIALIZED on DOMContentLoaded
    //   LOADED - resetting global window and document
    //
    // Since #importModulesPromise now resolves on this final 'load' event,
    // we're back to returning the result object directly.

    // Upon resolution of jsdom/jsdom#2475, delete this #importModulesPromise
    // call. (And delete this comment, and maybe the entire comment above.)
    try {
      await this.#importModules(window, document)
    } catch (err) {
      throw new Error(`error importing modules from ${pagePath}: ${err}`)
    }
    return { window, document, close() { window.close() } }
  }

  /**
   * Dynamically imports ECMAScript modules after the DOMContentLoaded event.
   * @param {Window} window - the jsdom window object
   * @param {Document} document - the jsdom window.document object
   * @returns {Promise} - resolves after importing all ECMAScript modules
   * @throws if importing any ECMAScript modules fails
   */
  #importModules(window, document) {
    return new Promise(resolve => {
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
        // the load event handler below fires after the manually dispatched
        // load event. This is best-effort, of course, as we can't know if any
        // async ops dispatched by those listeners will register a 'load' event
        // later. In that case, window and document may be undefined for those
        // listeners.
        //
        // The best defense against this problem would be to design the app to
        // register closures over window and document, or specific document
        // elements. That would ensure they remain defined even after we remove
        // window and document from globalThis.
        globalThis.window = window
        globalThis.document = document
        await importModules(document)

        // The DOMContentLoaded and load events registered by jsdom.fromFile()
        // will already have fired by this point.
        //
        // Manually firing DOMContentLoaded again after loading modules
        // approximates the requirement that modules execute before
        // DOMContentLoaded. This means that the modules can register
        // DOMContentLoaded event listeners and have them fire here. That
        // code shouldn't really be sensitive to the fact that
        // DOMContentLoaded fired earlier, but it's a possibility.
        //
        // For the same reason, we fire the 'load' event again as well. When
        // that listener executes, we can finally reset the global.window and
        // global.document variables.
        document.dispatchEvent(new window.Event(
          'DOMContentLoaded', {bubbles: true, cancelable: false}
        ))

        // Register our 'load' listener after any DOMContentLoaded listeners
        // have fired. This attempts to ensure (but cannot guarantee) that the
        // global window and document objects remain valid for any 'load'
        // listeners registered by the DOMContentLoaded listeners.
        const resetGlobals = () => resolve(
          delete globalThis.document, delete globalThis.window
        )
        window.addEventListener('load', resetGlobals, {once: true})
        window.dispatchEvent(new window.Event(
          'load', {bubbles: false, cancelable: false}
        ))
      }

      // If the page has other resources, like a stylesheet, it may still be
      // loading (document.readyState === "loading"). If not, it may already
      // have fired DOMContentLoaded (document.readyState === "interactive").
      // Either way, both will always fire before importModules() resolves, so
      // unconditionally register a "load" handler.
      window.addEventListener('load', importModulesOnEvent, {once: true})
    })
  }
}

/**
 * Imports modules from `<script type="module">` elements parsed by jsdom.
 *
 * Only works with the `src` attribute; it will not execute inline code.
 * @param {Document} doc - the jsdom window.document object
 * @returns {Promise} - resolves after importing all ECMAScript modules in doc
 * @throws if importing any ECMAScript modules fails
 */
function importModules(doc) {
  const modules = Array.from(doc.querySelectorAll('script[type="module"]'))
  return Promise.all(modules.filter(m => m.src).map(async m => {
    try { await import(m.src) }
    catch (err) { throw Error(`error importing ${m.src}: ${err}`) }
  }))
}
