import { readFile } from 'node:fs/promises';

/** WASM loader for Node.js environments. */

const wasmURL = /* #__PURE__ */ new URL('./release.wasm', import.meta.url);
const wasm = /* #__PURE__ */ readFile(wasmURL);
export default wasm;
