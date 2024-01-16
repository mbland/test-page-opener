/* eslint-env browser */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { afterEach, beforeAll, describe, expect, test } from 'vitest'
import TestPageOpener from '../index.js'
import JsdomPageOpener from '../lib/jsdom.js'

describe('TestPageOpener', () => {
  /** @type {TestPageOpener} */
  let opener

  beforeAll(async () => {opener = await TestPageOpener.create('/basedir/')})
  afterEach(() => {opener.closeAll()})

  test('loads page with module successfully', async () => {
    const { document } = await opener.open('test-modules/index.html')
    /** @type {(HTMLDivElement | null)} */
    const appElem = document.querySelector('#app')
    /** @type {(HTMLAnchorElement | null)} */
    const linkElem = document.querySelector('#app p a')

    expect(appElem).not.toBeNull()
    expect((appElem || {}).textContent).toContain('Hello, World!')
    expect(linkElem).not.toBeNull()
    expect((linkElem || {}).href).toContain('%22Hello,_World!%22')
  })

  test('constructor throws if called directly', () => {
    const opener = new JsdomPageOpener({JSDOM: {fromFile: () => {}}})
    expect(() => new TestPageOpener('unused', opener))
      .toThrowError('use TestPageOpener.create() instead')
  })

  test('constructor throws if basePath is malformed', async () => {
    const prefix = 'basePath should start with \'/\' and end with \'/\', got:'

    await expect(() => TestPageOpener.create('basedir/')).rejects
      .toThrowError(`${prefix} "basedir/"`)
    await expect(() => TestPageOpener.create('/basedir')).rejects
      .toThrowError(`${prefix} "/basedir"`)
  })

  test('open() throws if page path starts with \'/\'', async () => {
    await expect(opener.open('/index.html')).rejects
      .toThrowError('page path shouldn\'t start with \'/\', got: "/index.html"')
  })
})
