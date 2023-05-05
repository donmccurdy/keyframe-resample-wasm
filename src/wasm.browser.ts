/** WASM loader for Web environments. */
const wasm = /* #__PURE__ */ fetch(new URL('./release.wasm', import.meta.url));
export default wasm;
