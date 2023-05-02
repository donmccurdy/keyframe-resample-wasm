/** WASM loader for Web environments. */
const wasm = fetch(new URL('../dist/release.wasm', import.meta.url));
export default wasm;
