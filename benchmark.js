import { readFile } from 'node:fs/promises';
import { resample } from 'keyframe-resample';
import { resample as resampleWASM, Interpolation } from './build/release.js';

const samplers = JSON.parse(await readFile('./data/arm_keyframes.json', { encoding: 'utf-8' }));
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

/******************************************************************************
 * Utilities
 */

function getInterpolation(sampler) {
	if (sampler.interpolation === 'LINEAR') {
		return sampler.path === 'rotation' ? 'slerp' : 'lerp';
	} else if (sampler.interpolation === 'STEP') {
		return 'step';
	} else {
		throw new Error(`Unexpected interpolation, ${sampler.interpolation}`);
	}
}

function getInterpolationWASM(sampler) {
	if (sampler.interpolation === 'LINEAR') {
		return sampler.path === 'rotation' ? Interpolation.SLERP : Interpolation.LERP;
	} else if (sampler.interpolation === 'STEP') {
		return Interpolation.STEP;
	} else {
		throw new Error(`Unexpected interpolation, ${sampler.interpolation}`);
	}
}

function formatLong(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function dim(str) {
	return `\x1b[2m${str}\x1b[0m`;
}
