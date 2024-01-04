# Test Page Opener

Enables an application's tests to open its own page URLs both in the browser and
in [Node.js][] using [jsdom][]. Supports [JavaScript modules][] loaded via the
`src` attribute of [&lt;script type="module"&gt; tags][esm-script-tag].

_**Status**: I've still got a bit of work to do before publishing v1.0.0. I need
to add tests based on the mbland/tomcat-servlet-testing-example project from
whence this came, add more documentation, and refactor. I plan to finish this by
2024-01-04._

Source: <https://github.com/mbland/test-page-opener>

[![License](https://img.shields.io/github/license/mbland/test-page-opener.svg)](https://github.com/mbland/test-page-opener/blob/main/LICENSE.txt)
[![CI status](https://github.com/mbland/test-page-opener/actions/workflows/run-tests.yaml/badge.svg)](https://github.com/mbland/test-page-opener/actions/workflows/run-tests.yaml?branch=main)
[![Test results](https://github.com/mbland/test-page-opener/actions/workflows/publish-test-results.yaml/badge.svg)](https://github.com/mbland/test-page-opener/actions/workflows/publish-test-results.yaml?branch=main)
[![Coverage Status](https://coveralls.io/repos/github/mbland/test-page-opener/badge.svg?branch=main)][coveralls-tpo]
[![npm version](https://badge.fury.io/js/test-page-opener.svg)][npm-tpo]

## Installation

Add this package to your project's `devDependencies`, e.g., using [pnpm][]:

```sh
pnpm add -D test-page-opener
```

## Usage

## Motivation

### Validating initial page state using different DOM implementations

The `TestPageOpener` class enables smaller tests to validate the initial state
of an application's pages after the [DOMContentLoaded][] and [window.load][]
events. They can access the [DOM][] directly, using **jsdom** or any browser
implementation interchangeably. Running the same tests using Node.js, then in
different browsers, then becomes very easy using frontend development and
testing frameworks like [Vite][] together with [Vitest][].

### Accelerating development while building confidence

Using **jsdom** as a [test double][] in Node.js makes detecting and fixing
problems much faster than testing solely using the browser. Then running the
same tests unchanged in the browser increases confidence in both the code under
test and in the tests themselves.

Most of your code will behave the same way running under **jsdom** it will under
any browser implementation most of the time. This is why **jsdom** is such an
effective test double, because it helps validate most behaviors and catch most
programming errors very quickly. However, if the tests do reveal behavioral
discrepancies between **jsdom** and any browsers, developing robust, portable
solutions also becomes much faster than using larger tests.

`TestPageOpener` extends these benefits to page loading, which would otherwise
be beyond the reach of smaller tests. Not all of your smaller tests need or
should use it&mdash;most of your page logic should be testable independently
from its own [Window][] context. But you can use `TestPageOpener` to write
smaller, faster tests for some behavior that would normally involve writing
larger, slower tests.

### Testing independently from a backend server and tests in other languages

Using `TestPageOpener` with frameworks like [Vite][] and [Vitest][] can help
validate some page loading details without building and serving the backend.
This is especially convenient if the backend and/or your larger tests that use
[Selenium WebDriver][] or another browser-based framework are in another
language. You can iterate quickly on JavaScript, in JavaScript, without other
languages, tools, or processes involved until you're reasonably confident that
everything is in order.

### Reducing investment in writing and running larger test suites

`TestPageOpener` avoids having to validate _all_ page loading logic by _only_
using frameworks like [Selenium WebDriver][] that interact with pages by
launching a separate browser. It can validate loading behaviors that are beyond
the scope of unit tests for individual page components while using the same unit
testing framework.

Writing all page validation tests using `TestPageOpener` may not be feasible,
and isn't necessarily desirable. However, it enables rapid iteration on details
that can be validated this way. Combined with a suite of small, fast tests for
individual components, it can allow for fast smoke testing before running larger
test suites. In turn, this reduces the need to write as many larger tests, to
run them as frequently, or to spend as much time debugging failures.

### Improving coverage, efficiency, and productivity overall

Designing for testability, and using `TestPageOpener` to write smaller tests as
appropriate, can improve test coverage while relying less on larger tests to
validate everything. Failures can be caught (and fixes validated) by tests of
the appropriate size and scope, minimizing the time to diagnose, repair, and
recover from them. This improves the speed, stability, and coverage of the
entire test suite, making every individual test more valuable and more of a
boost to productivity. The larger and more complex the system&mdash;and the team
developing it&mdash;the greater the overall benefit.

For more thoughts on this approach to automated testing, see [The Test Pyramid
and the Chain Reaction][].

## Features and limitations

### Limited JavaScript/ECMAScript/ES6 Module (a.k.a. ESM) support for jsdom

**jsdom** doesn't natively support [JavaScript modules][] at all, even though
Node.js has supported [ECMAScript modules][] since v18. The problem is that the
current Node.js ESM API leaves the implementation the nontrivial [ESM resolution
and loading algorithm][] up to the user. See: [jsdom/jsdom: &lt;script
type=module&gt; support #2475][jsdom-2475].

`TestPageOpener` provides limited support for modules loaded via the `src`
attribute of [&lt;script type="module"&gt; tags][esm-script-tag]. It achieves
this by passing the `src` path to [dynamic import()][]. Inline module scripts
and [&lt;script type="importmap"&gt;][] aren't supported.

## Examples

My [mbland/tomcat-servlet-testing-example][] project

### Component frameworks and/or patterns

### Page Object pattern

### Using a fake backend

- Injecting a backend address
- CORS

### Stubbing fetch()?

## Development

Uses [pnpm][] and [Vitest][] for building and testing.

Uses [GitHub Actions][] for continuous integration.

Developed using [Vim][], [Visual Studio Code][], and [IntelliJ IDEA][]
interchangeably, depending on my inclination from moment to moment.

## Background

I developed this while writing tests for the frontend component of
[mbland/tomcat-servlet-testing-example][], found under
`strcalc/src/main/frontend`. I started developing the Java backend first, then
wrote an initial Selenium WebDriver test in Java against a placeholder frontend
page. When I started to focus on developing the frontend, I wanted to see if I
could write tests that could run both in Node.js and any browser.

`TestPageOpener` is the result of that experiment. At first I thought I might
use it to make _all_ of my frontend tests portable from jsdom to any browser.
Eventually I realized I only really needed it to validate page loading. The
[Vitest browser mode][] (using the [@vitest/browser][] plugin) enables all other
tests written using the [jsdom environment][] to run as expected in the browser.

## Copyright

&copy; 2023 Mike Bland &lt;<mbland@acm.org>&gt; (<https://mike-bland.com/>)

## Open Source License

This software is made available as [Open Source software][] under the [Mozilla
Public License 2.0][]. For the text of the license, see the
[LICENSE.txt](./LICENSE.txt) file. See the [MPL 2.0 FAQ][mpl-faq] for a higher
level explanation.

[Node.js]: http://nodejs.org/
[jsdom]: https://github.com/jsdom/jsdom
[JavaScript Modules]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
[esm-script-tag]: https://developer.mozilla.org/docs/Web/HTML/Element/script#module
[coveralls-tpo]: https://coveralls.io/github/mbland/test-page-opener?branch=main
[npm-tpo]: https://www.npmjs.com/package/test-page-opener
[pnpm]: https://pnpm.io/
[DOMContentLoaded]: https://developer.mozilla.org/docs/Web/API/Document/DOMContentLoaded_event
[window.load]: https://developer.mozilla.org/docs/Web/API/Window/load_event
[DOM]: https://developer.mozilla.org/docs/Web/API/Document_Object_Model
[Vite]: https://vitejs.dev/
[Vitest]: https://vitest.dev/
[test double]: https://mike-bland.com/2023/09/06/test-doubles.html
[Window]: https://developer.mozilla.org/docs/Web/API/Window
[Selenium WebDriver]: https://www.selenium.dev/documentation/webdriver/
[The Test Pyramid and the Chain Reaction]: https://mike-bland.com/2023/08/31/the-test-pyramid-and-the-chain-reaction.html
[ECMAScript Modules]: https://nodejs.org/docs/latest-v18.x/api/esm.html
[ESM resolution and loading algorithm]: https://nodejs.org/docs/latest-v18.x/api/esm.html#resolution-and-loading-algorithm
[jsdom-2475]: https://github.com/jsdom/jsdom/issues/2475
[dynamic import()]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import
[&lt;script type="importmap"&gt;]: https://developer.mozilla.org/docs/Web/HTML/Element/script/type/importmap
[mbland/tomcat-servlet-testing-example]: https://github.com/mbland/tomcat-servlet-testing-example
[GitHub Actions]: https://docs.github.com/actions
[Vim]: https://www.vim.org/
[Visual Studio Code]: https://code.visualstudio.com/
[IntelliJ IDEA]: https://www.jetbrains.com/idea/
[Vitest browser mode]: https://vitest.dev/guide/browser.html
[@vitest/browser]: https://www.npmjs.com/package/@vitest/browser
[jsdom environment]: https://vitest.dev/guide/environment.html
[Open Source software]: https://opensource.org/osd-annotated
[Mozilla Public License 2.0]: https://www.mozilla.org/MPL/
[mpl-faq]: https://www.mozilla.org/MPL/2.0/FAQ/
