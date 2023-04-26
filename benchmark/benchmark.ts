import { readFile } from 'node:fs/promises';
import { resample } from 'keyframe-resample';
import { resample as resampleWASM, Interpolation } from '../build/release.js';
import { performance } from 'node:perf_hooks';

const BYTES_PER_MB = 1024 * 1024;
const MS_PER_S = 1000;

interface Sampler {
	input: number[];
	output: number[];
	interpolation: 'CUBICSPLINE' | 'LINEAR' | 'STEP';
	path: string;
}

const samplersPath = new URL('../data/arm_keyframes.json', import.meta.url);
const samplers = JSON.parse(await readFile(samplersPath, { encoding: 'utf-8' }));
let srcCount = 0;
let dstCount = 0;
let byteLength = 0;

for (const sampler of samplers) {
	byteLength += sampler.input.length * 4 + sampler.output.length * 4;
}

console.log(`-----------\nBenchmark`);
console.log(`  ${formatLong(samplers.length)} samplers`);
console.log(`  ${formatLong(Math.round(byteLength))} bytes`);

/******************************************************************************
 * JavaScript
 */

let t0 = performance.now();
for (const sampler of samplers) {
	srcCount += sampler.input.length;
	dstCount += resample(sampler.input, sampler.output, getInterpolation(sampler));
}
let t = performance.now() - t0;

console.log(`JavaScript`);
console.log(dim(`  ${formatLong(Math.round(t))}ms`));
console.log(dim(`  ${Math.round(byteLength / BYTES_PER_MB / (t / MS_PER_S))} MB/s`));
console.log(dim(`  ${formatLong(srcCount)} → ${formatLong(dstCount)} keyframes`));

/******************************************************************************
 * WebAssembly
 */

srcCount = dstCount = 0;

t0 = performance.now();
for (const sampler of samplers) {
	srcCount += sampler.input.length;
	dstCount += resampleWASM(sampler.input, sampler.output, getInterpolationWASM(sampler));
}
t = performance.now() - t0;

console.log(`WASM`);
console.log(dim(`  ${formatLong(Math.round(t))}ms`));
console.log(dim(`  ${Math.round(byteLength / BYTES_PER_MB / (t / MS_PER_S))} MB/s`));
console.log(dim(`  ${formatLong(srcCount)} → ${formatLong(dstCount)} keyframes`));

// console.log(resampleWASM.__collect);

/******************************************************************************
 * Utilities
 */

function getInterpolation(sampler: Sampler) {
	if (sampler.interpolation === 'LINEAR') {
		return sampler.path === 'rotation' ? 'slerp' : 'lerp';
	} else if (sampler.interpolation === 'STEP') {
		return 'step';
	} else {
		throw new Error(`Unexpected interpolation, ${sampler.interpolation}`);
	}
}

function getInterpolationWASM(sampler: Sampler) {
	if (sampler.interpolation === 'LINEAR') {
		return sampler.path === 'rotation' ? Interpolation.SLERP : Interpolation.LERP;
	} else if (sampler.interpolation === 'STEP') {
		return Interpolation.STEP;
	} else {
		throw new Error(`Unexpected interpolation, ${sampler.interpolation}`);
	}
}

function formatLong(x: number): string {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function dim(str: string) {
	return `\x1b[2m${str}\x1b[0m`;
}
