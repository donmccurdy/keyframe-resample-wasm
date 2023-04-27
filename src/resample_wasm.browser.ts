/** WASM loader for Web environments. */
const wasm = import(new URL('release.wasm', import.meta.url).href);
export default wasm;
