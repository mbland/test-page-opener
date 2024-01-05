/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { afterEach, beforeAll, describe, expect, test } from 'vitest'
import { PageOpener } from '../index.js'

describe('PageOpener', () => {
  let opener

  beforeAll(async () => opener = await PageOpener.create('/basedir/'))
  afterEach(() => opener.closeAll())

  test('loads page with module successfully', async () => {
    const { document } = await opener.open('test-modules/index.html')
    const appElem = document.querySelector('#app')
    const linkElem = document.querySelector('#app p a')

    expect(appElem.textContent).toContain('Hello, World!')
    expect(linkElem.href).toContain('%22Hello,_World!%22')
  })

  test('constructor throws if called directly', () => {
    expect(() => new PageOpener('unused', null))
      .toThrowError('use PageOpener.create() instead')
  })

  test('constructor throws if basePath is malformed', async () => {
    const newOpener = (basePath) => () => PageOpener.create(basePath)
    const prefix = 'basePath should start with \'/\' and end with \'/\', got:'

    await expect(newOpener('basedir/')).rejects.toThrow(`${prefix} "basedir/"`)
    await expect(newOpener('/basedir')).rejects.toThrow(`${prefix} "/basedir"`)
  })

  test('open() throws if page path starts with \'/\'', async () => {
    await expect(opener.open('/index.html')).rejects
      .toThrow('page path shouldn\'t start with \'/\', got: "/index.html"')
  })
})
