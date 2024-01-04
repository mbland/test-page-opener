/* eslint-env browser, node, jest, vitest */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
import { afterEach, describe, expect, test } from 'vitest'
import { PageOpener } from '../index.js'

describe('PageOpener', () => {
  const opener = new PageOpener('/basedir/')
  afterEach(() => opener.closeAll())

  test('contains the "Hello, World!" placeholder', async () => {
    const { document } = await opener.open('index.html')
    const appElem = document.querySelector('#app')
    const linkElem = document.querySelector('#app p a')

    expect(appElem.textContent).toContain('Hello, World!')
    expect(linkElem.href).toContain('%22Hello,_World!%22')
  })
})
