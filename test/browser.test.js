/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { DEFAULT_COVERAGE_KEY, getCoverageKey } from '../lib/browser.js'
import { describe, expect, test } from 'vitest'

describe('getCoverageKey', () => {
  test('returns existing coverage key', () => {
    expect(getCoverageKey({__coverage__: null})).toBe('__coverage__')
    expect(getCoverageKey({__VITEST_COVERAGE__: null}))
      .toBe('__VITEST_COVERAGE__')
  })

  test('returns default __coverage__ key if no existing key', () => {
    expect(getCoverageKey({})).toBe(DEFAULT_COVERAGE_KEY)
  })
})
