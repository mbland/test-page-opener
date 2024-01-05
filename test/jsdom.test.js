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

    const result = opener.open('unused', pagePath)

    await expect(result).rejects.toThrowError(`opening ${pagePath}`)
    await result.catch(err => {
      expect(err.cause.message).toBe(`importing ${moduleUrl.href}`)
      expect(err.cause.cause.message).toBe('test error')
    })
  })
})
