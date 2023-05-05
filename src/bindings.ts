import wasm from './wasm.env.js';
import { Interpolation, TO_INTERPOLATION_INTERNAL } from './constants.js';

///////////////////////////////////////////////////////////////////////////////
// WASM API
///////////////////////////////////////////////////////////////////////////////

interface Instance extends WebAssembly.WebAssemblyInstantiatedSource {
	exports: InstanceExports;
}

interface InstanceExports {
	memory: WebAssembly.Memory;
	resample: (input: number, output: number, interpolation: number, tolerance: number) => number;
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

export const ready = /* #__PURE__ */ new Promise<void>(async (resolve, reject) => {
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
	})) as Instance;
	return instance.exports;
}

///////////////////////////////////////////////////////////////////////////////
// PUBLIC API
///////////////////////////////////////////////////////////////////////////////

const CHUNK_SIZE = 1024;

// The first and last keyframes cannot be removed in any given step, but we need to
// somehow remove keyframes on chunk boundaries. So after processing each chunk,
// we copy its last two keyframes in front of the next chunk, and run from there.
//
// 🟩 ⬜️ ⬜️ ⬜️ ⬜️ ⬜️                  // chunk 1, original
// 🟩 ⬜️ 🟨 🟥                       // chunk 1, resampled
//            🟨 🟥 🟩 ⬜️ ⬜️ ⬜️       // chunk 2, original
//            🟨 🟩 ⬜️ ⬜️            // chunk 2, resampled
// ...
export function resample(
	input: Float32Array,
	output: Float32Array,
	interpolation: Interpolation,
	tolerance = 1e-4
): number {
	__assert(!!exports, 'Await "ready" before using module.');
	__assert(input instanceof Float32Array, 'Missing Float32Array input.');
	__assert(output instanceof Float32Array, 'Missing Float32Array output.');

	const outputSize = output.length / input.length;

	__assert(Number.isInteger(outputSize), 'Invalid input/output counts.');
	__assert(interpolation in TO_INTERPOLATION_INTERNAL, 'Invalid interpolation.');
	__assert(Number.isFinite(tolerance), 'Invalid tolerance');

	const interpVal = TO_INTERPOLATION_INTERNAL[interpolation];
	const srcCount = input.length;
	let dstCount = 0;

	for (let chunkStart = 0; chunkStart < input.length; chunkStart += CHUNK_SIZE) {
		const chunkCount = Math.min(srcCount - chunkStart, CHUNK_SIZE);

		// Allocate a two-keyframe prefix for all chunks after the first.
		const prefixCount = chunkStart > 0 ? 2 : 0;
		const chunkInput = new Float32Array(
			input.buffer,
			input.byteOffset + (chunkStart - prefixCount) * Float32Array.BYTES_PER_ELEMENT,
			chunkCount + prefixCount
		);
		const chunkOutput = new Float32Array(
			output.buffer,
			output.byteOffset +
				(chunkStart - prefixCount) * outputSize * Float32Array.BYTES_PER_ELEMENT,
			(chunkCount + prefixCount) * outputSize
		);

		// Copy prefix to start of next chunk.
		if (prefixCount > 0) {
			input.copyWithin(chunkStart - prefixCount, dstCount - prefixCount, dstCount);
			output.copyWithin(
				(chunkStart - prefixCount) * outputSize,
				(dstCount - prefixCount) * outputSize,
				dstCount * outputSize
			);
		}

		const inputPtr = __retain(__lowerStaticArray(chunkInput, 4, 2));
		const outputPtr = __retain(__lowerStaticArray(chunkOutput, 4, 2));
		try {
			exports.__setArgumentsLength(4);
			const count = exports.resample(inputPtr, outputPtr, interpVal, tolerance) >>> 0;
			dstCount -= prefixCount;
			__liftStaticArray(inputPtr, input, dstCount, count);
			__liftStaticArray(outputPtr, output, dstCount * outputSize, count * outputSize);
			dstCount += count;
		} finally {
			__release(inputPtr);
			__release(outputPtr);
			exports.__collect();
		}
	}

	// console.log(`Memory: ${exports.memory.buffer.byteLength} bytes`);

	return dstCount;
}

///////////////////////////////////////////////////////////////////////////////
// INTERNAL
///////////////////////////////////////////////////////////////////////////////

function __assert(cond: boolean, msg: string) {
	if (!cond) throw new Error(msg);
}

function __retain(ptr: number): number {
	exports.__pin(ptr);
	return ptr;
}

function __release(ptr: number): number {
	exports.__unpin(ptr);
	return ptr;
}

function __liftString(ptr: number) {
	if (!ptr) return null;
	const end = (ptr + new Uint32Array(exports.memory.buffer)[(ptr - 4) >>> 2]) >>> 1,
		memoryU16 = new Uint16Array(exports.memory.buffer);
	let start = ptr >>> 1,
		string = '';
	while (end - start > 1024)
		string += String.fromCharCode(...memoryU16.subarray(start, (start += 1024)));
	return string + String.fromCharCode(...memoryU16.subarray(start, end));
}

function __lowerStaticArray(values: Float32Array, id: number, align: number) {
	const ptr = exports.__pin(exports.__new(values.length << align, id)) >>> 0;
	new Float32Array(exports.memory.buffer, ptr, values.length).set(values);
	exports.__unpin(ptr);
	return ptr;
}

function __liftStaticArray(ptr: number, values: Float32Array, offset: number, count: number) {
	values.set(new Float32Array(exports.memory.buffer, ptr, count), offset);
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
