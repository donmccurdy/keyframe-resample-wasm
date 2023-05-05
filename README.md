# keyframe-resample-wasm

[![Latest NPM release](https://img.shields.io/npm/v/keyframe-resample.svg)](https://www.npmjs.com/package/keyframe-resample)
[![Build Status](https://github.com/donmccurdy/keyframe-resample-wasm/workflows/CI/badge.svg?branch=main&event=push)](https://github.com/donmccurdy/keyframe-resample-wasm/actions?query=workflow%3ACI)

Resamples and optimizes keyframe data using WebAssembly. Minzipped size is about 6-7 kb.

> **IMPORTANT:** This project is experimental and a work in progress.

AssemblyScript / WASM findings:

- Prefer StaticArray
- Use unchecked array read/write (180 MB/s → 680 MB/s)
- Any size optimization can have a performance cost, measure it
- Default bindings are not npm-ready, may need to hand-write
- Incremental GC has some overhead, measure it

## Installation

```
npm install --save keyframe-resample
```

### Compatibility

The `keyframe-resample` module will load a WebAssembly binary as a static resource, as described in [Web.Dev: Bundling non-JavaScript resources
](https://web.dev/bundling-non-js-resources/#universal-pattern-for-browsers-and-bundlers). This method in compatible with Node.js, most browsers, and applications compiled with a modern bundler. For older bundlers, a `keyframe-resample/compat` module is also available, loading the WebAssembly binary from an inline Data URI. The compatibility build is a couple kilobytes larger, and requires more time to process the WebAssembly binary.

## API

```javascript
import { ready, resample } from 'keyframe-resample'; // Node.js, browsers, and modern bundlers
import { ready, resample } from 'keyframe-resample/compat'; // Legacy bundlers

// wait for WASM to compile
await ready;

// keyframe times, in seconds
const srcTimes = new Float32Array([0, 0.1, 0.2, 0.3, 0.4]);

// keyframe values, N-dimensional vectors
const srcValues = new Float32Array([
    0, 0, 1,
    0, 0, 2,
    0, 0, 3,
    0, 0, 4,
    0, 0, 5,
]);

// resample keyframes, remove those unnecessary with interpolation.
const count = resample(srcTimes, srcValues, 'lerp');

// results are written to start of source array.
const dstTimes = srcTimes.slice(0, count); // → [0, 0.4]
const dstValues = srcValues.slice(0, count * 3); // → [0, 0, 1, 0, 0, 5]
```

In addition to the `resample(...)` function implemented in WebAssembly, a `resampleDebug(...)` function implemented in plain JavaScript is also exported. The WebAssembly implementation runs considerably faster.

### Interpolation modes

| mode      | description                                                 |
|-----------|-------------------------------------------------------------|
| `'step'`  | Step (also called discrete or constant) interpolation.      |
| `'lerp'`  | Linear, per-component interpolation.                        |
| `'slerp'` | Spherical linear interpolation, valid only for quaternions. |

## Contributing

To build the project locally, run:

```
npm install
npm run dist
```

To test changes:

```
npm run test
npm run benchmark
```

Optimizations and bug fixes are welcome. Please consider filing an issue to discuss possible
feature additions.

## License

Copyright 2023, MIT License.
