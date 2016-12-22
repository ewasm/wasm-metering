# SYNOPSIS 
[![NPM Package](https://img.shields.io/npm/v/wasm-metering.svg?style=flat-square)](https://www.npmjs.org/package/wasm-metering)
[![Build Status](https://img.shields.io/travis/ewasm/wasm-metering.svg?branch=master&style=flat-square)](https://travis-ci.org/ewasm/wasm-metering)
[![Coverage Status](https://img.shields.io/coveralls/ewasm/wasm-metering.svg?style=flat-square)](https://coveralls.io/r/ewasm/wasm-metering)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)  

Injects metering into webassembly binaries

# INSTALL
`npm install wasm-metering`

# USAGE
```javascript
const metering = require('wasm-metering')
const wasm = require('./test.wasm')
const meteredWasm = metering.meterWASM(wasm)
```

# API
# meterJSON

[./index.js:102-210](https://github.com/ewasm/wasm-metering/blob/ce319c7c12005dd6b902a6bdef839a06336bed0c/./index.js#L102-L210 "Source code on GitHub")

Injects metering into a JSON output of [wasm2json](https://github.com/ewasm/wasm-json-toolkit#wasm2json)

**Parameters**

-   `json` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the json tobe metered
-   `constTable` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the cost table to meter with. See these notes about the default.
-   `costTable`  
-   `moduleStr` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)](default 'metering')** the import string for the metering function
-   `fieldStr` **\[fieldStr](default 'usegas')** the field string for the metering function

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** This contains the fields `initailAmount`, the amount it
cost to start the module and `module`, the metered json.

# meterWASM

[./index.js:221-228](https://github.com/ewasm/wasm-metering/blob/ce319c7c12005dd6b902a6bdef839a06336bed0c/./index.js#L221-L228 "Source code on GitHub")

Injects metering into a webassembly binary

**Parameters**

-   `wasm` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the wasm tobe metered
-   `constTable` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the cost table to meter with. See these notes about the default.
-   `costTable`  
-   `moduleStr` **\[[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)](default 'metering')** the import string for the metering function
-   `fieldStr` **\[fieldStr](default 'usegas')** the field string for the metering function

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** This contains the fields `initailAmount`, the amount it
cost to start the module and `module`, the metered json.

# LICENSE
[MPL-2.0](https://tldrlegal.com/license/mozilla-public-license-2.0-(mpl-2))
