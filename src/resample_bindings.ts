import wasm from './resample_wasm.env.js';
import { Interpolation } from './constants.js';

///////////////////////////////////////////////////////////////////////////////
// WASM API
///////////////////////////////////////////////////////////////////////////////

interface Instance {
	exports: InstanceExports;
}

interface InstanceExports {
	memory: Uint8Array;
	resample: (
		input: number,
		output: number,
		interpolation: number,
		tolerance: number,
		normalized: number
	) => number;
	__setArgumentsLength: (length: number) => void;
	__new: (byteLength: number, id: number) => number;
	__pin: (ptr: number) => number;
	__unpin: (ptr: number) => void;
	__collect: () => void;
}

///////////////////////////////////////////////////////////////////////////////
// SETUP
///////////////////////////////////////////////////////////////////////////////

let exports: InstanceExports;

export const ready = new Promise<void>(async (resolve, reject) => {
	try {
		const module = await WebAssembly.compile(await wasm);
		exports = await instantiate(module as BufferSource, {});
		resolve();
	} catch (e) {
		reject(e);
	}
});

async function instantiate(module: BufferSource, imports = {}): Promise<InstanceExports> {
	const instance = (await WebAssembly.instantiate(module, {
		env: Object.assign(Object.create(globalThis), {}, { abort: __abort }),
	})) as unknown as Instance;
	return instance.exports;
}

///////////////////////////////////////////////////////////////////////////////
// PUBLIC API
///////////////////////////////////////////////////////////////////////////////

export function resampleWASM(
	input: Float32Array,
	output: Float32Array,
	interpolation: Interpolation,
	tolerance = 1e4,
	normalized = false
): number {
	if (!exports) throw new Error('Module not initialized; await the "ready" export.');
	if (!(input instanceof Float32Array)) throw new Error('Missing Float32Array input.');
	if (!(output instanceof Float32Array)) throw new Error('Missing Float32Array output.');
	if (!Number.isFinite(interpolation)) throw new Error('Invalid interpolation.');
	if (!Number.isFinite(tolerance)) throw new Error('Invalid tolerance.');

	const inputPtr = __retain(__lowerStaticArray(input, 4, 2));
	const outputPtr = __retain(__lowerStaticArray(output, 4, 2));
	const normalizedVal = normalized ? 1 : 0;

	try {
		exports.__setArgumentsLength(arguments.length);
		const count = exports.resample(
			inputPtr,
			outputPtr,
			interpolation,
			tolerance,
			normalizedVal
		);
		return count >>> 0;
	} finally {
		__release(inputPtr);
		__release(outputPtr);
		exports.__collect();
	}
}

///////////////////////////////////////////////////////////////////////////////
// INTERNAL
///////////////////////////////////////////////////////////////////////////////

function __retain(ptr: number): number {
	exports.__pin(ptr);
	return ptr;
}

function __release(ptr: number): number {
	exports.__unpin(ptr);
	return ptr;
}

function __liftString(pointer: number) {
	if (!pointer) return null;
	const end = (pointer + new Uint32Array(exports.memory.buffer)[(pointer - 4) >>> 2]) >>> 1,
		memoryU16 = new Uint16Array(exports.memory.buffer);
	let start = pointer >>> 1,
		string = '';
	while (end - start > 1024)
		string += String.fromCharCode(...memoryU16.subarray(start, (start += 1024)));
	return string + String.fromCharCode(...memoryU16.subarray(start, end));
}

function __lowerStaticArray(values: Float32Array, id: number, align: number) {
	const buffer = exports.__pin(exports.__new(values.length << align, id)) >>> 0;
	new Float32Array(exports.memory.buffer, buffer, values.length).set(values);
	exports.__unpin(buffer);
	return buffer;
}

function __abort(
	messagePtr: number,
	fileNamePtr: number,
	lineNumber: number,
	columnNumber: number
): void {
	const message = __liftString(messagePtr >>> 0);
	const fileName = __liftString(fileNamePtr >>> 0);
	lineNumber = lineNumber >>> 0;
	columnNumber = columnNumber >>> 0;
	(() => {
		throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
	})();
}
