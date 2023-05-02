/** WASM loader for Web environments. */
const wasm = fetch(new URL('./release.wasm', import.meta.url));
export default wasm;
