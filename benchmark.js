import { readFile } from 'node:fs/promises';
import { resample } from 'keyframe-resample';

const samplers = JSON.parse(await readFile('./data/arm_keyframes.json', { encoding: 'utf-8' }));
let srcCount = 0;
let dstCount = 0;

const t0 = performance.now();
for (const sampler of samplers) {
	srcCount += sampler.input.length;
	const result = resample(sampler.input, sampler.output, getInterpolation(sampler));
	dstCount += result.input.length;
}
const t = performance.now() - t0;

console.log(
	`✅ ${formatLong(Math.round(t))}ms CPU time ` +
		dim(`(${formatLong(srcCount)} → ${formatLong(dstCount)} keyframes)`)
);

function getInterpolation(sampler) {
	let interpolation;
	if (sampler.interpolation === 'LINEAR') {
		interpolation = sampler.path === 'rotation' ? 'slerp' : 'lerp';
	} else if (sampler.interpolation === 'STEP') {
		interpolation = 'step';
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
