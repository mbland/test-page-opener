/* eslint-env browser */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import JsdomPageOpener from '../lib/jsdom.js'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

describe.skipIf(globalThis.window !== undefined)('JsdomPageOpener', () => {
  const origWindow = globalThis.window
  const origDocument = globalThis.document

  /** @type {JsdomPageOpener} */
  let opener

  beforeAll(async () => {opener = new JsdomPageOpener(await import('jsdom'))})

  afterEach(() => {
    globalThis.window = origWindow
    globalThis.document = origDocument
    vi.restoreAllMocks()
  })

  test('restores original globalThis.{window,document}', async () => {
    const pagePath = './test-modules/index.html'
    const testWindow = /** @type {Window & typeof globalThis} */ ({})
    const testDocument = /** @type {Document} */ ({})
    globalThis.window = testWindow
    globalThis.document = testWindow.document = testDocument

    const { close } = await opener.open('/basedir/', pagePath)
    close()

    expect(globalThis.window).toBe(testWindow)
    expect(globalThis.document).toBe(testWindow.document)
  })

  test('reports module loading errors', async () => {
    const pagePath = './test-modules/error.html'
    const { pathToFileURL } = await import('node:url')
    const moduleUrl = pathToFileURL('./test-modules/error.js')

    const result = opener.open('unused', pagePath)

    await expect(result).rejects.toThrowError(`opening ${pagePath}`)
    await result.catch(err => {
      expect(err.cause.message).toBe(`importing ${moduleUrl.href}`)
      expect(err.cause.cause.message).toBe('test error')
    })
  })

  test('doesn\'t throw if missing app div', async () => {
    const pagePath = './test-modules/missing.html'
    const consoleSpy = vi.spyOn(console, 'error')
      .mockImplementationOnce(() => {})

    const { close } = await opener.open('/basedir/', pagePath)
    close()

    expect(consoleSpy).toBeCalledWith('no #app element')
  })
})
