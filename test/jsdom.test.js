/* eslint-env browser */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import JsdomPageOpener from '../lib/jsdom.js'
import JsdomFixture from './jsdom-fixture.js'
import { afterEach, beforeAll, describe, expect, test } from 'vitest'

describe.skipIf(globalThis.window)('JsdomPageOpener', () => {
  /** @type {JsdomPageOpener} */
  let opener
  const fixture = new JsdomFixture()

  beforeAll(async () => {opener = new JsdomPageOpener(await import('jsdom'))})

  afterEach(fixture.restoreOrigWindowAndDocument)

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
})
