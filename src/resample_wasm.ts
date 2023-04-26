import { readFile } from 'node:fs/promises';

const wasmURL = new URL('./release.wasm', import.meta.url);
const wasm = readFile(wasmURL);
export default wasm;
