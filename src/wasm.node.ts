import { readFile } from 'node:fs/promises';

/** WASM loader for Node.js environments. */

const wasmURL = new URL('./release.wasm', import.meta.url);
const wasm = readFile(wasmURL);
export default wasm;
