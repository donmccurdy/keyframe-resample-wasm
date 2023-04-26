# keyframe-resample

Resamples and optimizes keyframe data.

> **IMPORTANT:** This project is experimental and a work in progress.

To do:

- [ ] Support fixed-memory or GC.
- [ ] Include CJS, ESM, and Modern builds. (refer to mikktspace output)

AssemblyScript / WASM findings:

- Prefer StaticArray
- Use unchecked array read/write
- Any size optimization can have a performance cost, measure it
- Default bindings are not npm-ready, may need to hand-write
- Default bindings do not lower Float32Array → StaticArray optimally
- Incremental GC has some overhead, measure it
