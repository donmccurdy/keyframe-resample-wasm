import { NodeIO } from '@gltf-transform/core';
import { writeFile } from 'node:fs/promises';

const IN_PATH = new URL('../data/Arm.glb', import.meta.url);
const OUT_PATH = new URL('../data/arm_keyframes.json', import.meta.url);

/**
 * Utility script used to extract raw keyframe data from GLB files. Keyframe
 * data is stored as JSON, then loaded for benchmarks.
 */

const io = new NodeIO();
const document = await io.read(IN_PATH);

const results = [];

for (const animation of document.getRoot().listAnimations()) {
	const paths = new Map();
	for (const channel of animation.listChannels()) {
		const sampler = channel.getSampler();
		paths.set(sampler, channel.getTargetPath());
	}
	for (const sampler of animation.listSamplers()) {
		results.push({
			input: Array.from(sampler.getInput().getArray()),
			output: Array.from(sampler.getOutput().getArray()),
			normalized: sampler.getOutput().getNormalized(),
			path: paths.get(sampler),
			interpolation: sampler.getInterpolation(),
		});
	}
}

await writeFile(OUT_PATH, JSON.stringify(results, null, 2), { encoding: 'utf-8' });
