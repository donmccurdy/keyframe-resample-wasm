# keyframe-resample-wasm

[![Latest NPM release](https://img.shields.io/npm/v/keyframe-resample.svg)](https://www.npmjs.com/package/keyframe-resample)
[![Build Status](https://github.com/donmccurdy/keyframe-resample-wasm/workflows/CI/badge.svg?branch=main&event=push)](https://github.com/donmccurdy/keyframe-resample-wasm/actions?query=workflow%3ACI)

Resamples and optimizes keyframe data using WebAssembly.

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

## API

```javascript
import { ready, resample, resampleWASM } from 'keyframe-resample';

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
const count = resample(srcTimes, srcValues, 'lerp');     // slower
const count = resampleWASM(srcTimes, srcValues, 'lerp'); // faster

// results are written to start of source array.
const dstTimes = srcTimes.slice(0, count); // → [0, 0.4]
const dstValues = srcValues.slice(0, count * 3); // → [0, 0, 1, 0, 0, 5]
```

Supported interpolation modes:

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
