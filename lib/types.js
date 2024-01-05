/* eslint-env browser */
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/*
 * This technique for exporting JSDoc typedefs is based on a hint from:
 * - https://stackoverflow.com/a/76872194
 */

/**
 * Return value from PageOpener.open()
 * @typedef OpenedPage
 * @property {Window} window - Window object for the opened page
 * @property {Document} document - Document object parsed from the opened page
 * @property {Function} close - closes the page
 */

/**
 * @type {OpenedPage}
 */
export let OpenedPage
