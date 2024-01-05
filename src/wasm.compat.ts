/** WASM loader using an inline Data URI. */
const WASM_BASE64 = '';
const wasm: Promise<Uint8Array> = /* #__PURE__ */ fetch(
	'data:application/wasm;base64' + WASM_BASE64
)
	.then((response) => response.arrayBuffer())
	.then((buffer) => new Uint8Array(buffer));
export default wasm;
