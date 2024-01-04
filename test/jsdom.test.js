/* eslint-env browser, node, jest, vitest */

import JsdomPageOpener from '../lib/jsdom'
import { beforeAll, describe, expect, test } from 'vitest'

describe.skipIf(globalThis.window !== undefined)('JsdomPageOpener', () => {
  let opener
  let pathToFileURL

  beforeAll(async () => {
    const urlModule = await import('node:url')
    opener = new JsdomPageOpener(await import('jsdom'))
    pathToFileURL = urlModule.pathToFileURL
  })

  test('reports module loading errors', async () => {
    const pagePath = './test-modules/error.html'
    const moduleUrl = pathToFileURL('./test-modules/error.js')

    await expect(() => opener.open('unused', pagePath)).rejects
      .toThrowError(`error importing modules from ${pagePath}: ` +
        `Error: error importing ${moduleUrl.href}: Error: test error`)
  })
})
