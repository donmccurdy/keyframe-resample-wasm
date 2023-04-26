# keyframe-resample-wasm

Resamples and optimizes keyframe data using WebAssembly.

> **IMPORTANT:** This project is experimental and a work in progress.

To do:

- [ ] Support fixed-memory or GC
- [ ] Include CJS, ESM, and Modern builds. (refer to mikktspace output)
- [ ] Write results back to array
- [ ] Consider string enums in public API

AssemblyScript / WASM findings:

- Prefer StaticArray
- Use unchecked array read/write
- Any size optimization can have a performance cost, measure it
- Default bindings are not npm-ready, may need to hand-write
- Incremental GC has some overhead, measure it

## Installation

```
npm install --save keyframe-resample
```

## API

```javascript
import { resample, ready, Interpolation } from 'keyframe-resample';

await ready;

const srcTimes = new Float32Array([0, 0.1, 0.2, 0.3, 0.4]);
const srcValues = new Float32Array([
    0, 0, 1,
    0, 0, 2,
    0, 0, 3,
    0, 0, 4,
    0, 0, 5,
]);

const count = resample(times, values, Interpolation.LERP);

const dstTimes = srcTimes.slice(0, count); // → [0, 0.4]
const dstValues = srcValues.slice(0, count * 3); // → [0, 0, 1, 0, 0, 5]
```

Supported interpolation modes:

| mode  | description |
|-------|-------------|
| STEP  |             |
| LERP  |             |
| SLERP |             |

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
