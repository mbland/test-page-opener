/* eslint-env browser */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const HELLO_URL = 'https://en.wikipedia.org/wiki/%22Hello,_World!%22_program'

export default class App {
  /**
   * @param {object} _ - initialization parameters
   * @param {HTMLElement} _.appElem - root element of application
   */
  init({ appElem }) {
    const t = document.createElement('template')
    t.innerHTML = `<p><a href="${HELLO_URL}">Hello, World!</a></p>`
    appElem.appendChild(t.content)
  }
}
