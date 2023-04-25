import { readFile } from 'node:fs/promises';
import { resample } from 'keyframe-resample';
import { resample as resampleWASM, Interpolation } from '../build/release.js';
import { performance } from 'node:perf_hooks';

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

/******************************************************************************
 * JavaScript
 */

let t0 = performance.now();
for (const sampler of samplers) {
	srcCount += sampler.input.length;
	const result = resample(sampler.input, sampler.output, getInterpolation(sampler));
	dstCount += result.input.length;
}
let t = performance.now() - t0;

console.log(
	`✅ JavaScript: ${formatLong(Math.round(t))}ms ` +
		dim(`(${formatLong(srcCount)} → ${formatLong(dstCount)} keyframes)`)
);

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

console.log(
	`✅ WASM: ${formatLong(Math.round(t))}ms ` +
		dim(`(${formatLong(srcCount)} → ${formatLong(dstCount)} keyframes)`)
);

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
