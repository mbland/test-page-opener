/* eslint-env browser */

/*
 * Based on a hint from: https://stackoverflow.com/a/76872194
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
