/* eslint-env browser */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import JsdomPageOpener from '../../lib/jsdom.js'
import JsdomFixture from '../jsdom-fixture.js'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'

// This is in a separate directory from the other tests in ../jsdom.test.js. to
// prevent Node.js from using the same `test-modules/main.js` import. Otherwise:
//
// - If the test case were in the same file, the "missing #app div" branch
//   wouldn't execute and the test would fail.
//
// - If this test file were in the same directory, the Istanbul coverage
//   reporter wouldn't see the coverage from the "missing #app div" branch. I
//   don't know exactly why that is.
//
// At the same time, the previous `src="./main.js?version=missing"` query suffix
// is no longer necessary.
//
// This solves the coverage drop from:
//
// - mbland/test-page-opener#23
//   mbland/test-page-opener@01a79f6
//
// I got the idea to organize the tests this way after successfully covering
// similar code in:
//
// - mbland/tomcat-servlet-testing-example#85
//   mbland/tomcat-servlet-testing-example@b5df30e
describe.skipIf(globalThis.window)('JsdomPageOpener', () => {
  /** @type {JsdomPageOpener} */
  let opener
  const fixture = new JsdomFixture()

  beforeAll(async () => {opener = new JsdomPageOpener(await import('jsdom'))})

  afterEach(() => {
    fixture.restoreOrigWindowAndDocument()
    vi.restoreAllMocks()
  })

  test('logs error if missing #app div', async () => {
    const pagePath = './test-modules/missing.html'
    const consoleSpy = vi.spyOn(console, 'error')
      .mockImplementationOnce(() => {})

    const { close } = await opener.open('/basedir/', pagePath)
    close()

    expect(consoleSpy).toBeCalledWith('no #app element')
  })
})
