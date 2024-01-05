/** WASM loader for Web environments. */
const wasm: Promise<Uint8Array> = /* #__PURE__ */ fetch(
	/* #__PURE__ */ new URL('./release.wasm', import.meta.url)
)
	.then((response) => response.arrayBuffer())
	.then((buffer) => new Uint8Array(buffer));
export default wasm;
