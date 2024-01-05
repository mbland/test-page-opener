#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * @file Shows jsdom events firing before a dynamic `import()` resolves.
 *
 * This always happens despite the script starting the dynamic `import()` before
 * registering the `DOMContentLoaded` and `load` event handlers.
 *
 * This script produces the following output, indicating that `DOMContentLoaded`
 * did _not_ fire before `JSDOM.fromFile()` resolved:
 *
 * ```text
 * document.readyState === loading
 * DOMContentLoaded
 * load
 * Module imported
 * ```
 *
 * If you comment out or remove `<link rel="stylesheet">` from `index.html`, it
 * will produce the following output, indicating that `DOMContentLoaded` fired
 * before `JSDOM.fromFile()` resolved:
 *
 * ```text
 * document.readyState === interactive
 * load
 * Module imported
 * ```
 */

import { JSDOM } from 'jsdom'
import { fileURLToPath } from 'node:url'

/**
 * Prints a string to standard output
 * @param {string} str - string to write to process.stdout
 */
function print(str) { process.stdout.write(`${str}\n`) }

const pagePath = fileURLToPath(new URL('./index.html', import.meta.url))
const { window } = await JSDOM.fromFile(
  pagePath, {resources: 'usable', runScripts: 'dangerously'}
)
const document = window.document
const modulePath = document.querySelector('script[type="module"]').src
const importPromise = import(modulePath)

print(`document.readyState === ${document.readyState}`)
document.addEventListener('DOMContentLoaded', () => print('DOMContentLoaded'))
window.addEventListener('load', () => print('load'))
await importPromise
