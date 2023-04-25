import { NodeIO } from '@gltf-transform/core';
import { writeFile } from 'node:fs/promises';

/**
 * Utility script used to extract raw keyframe data from GLB files. Keyframe
 * data is stored as JSON, then loaded for benchmarks.
 */

const io = new NodeIO();
const document = await io.read('../data/Arm.glb');

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

await writeFile('../data/arm_keyframes.json', JSON.stringify(results, null, 2), {
	encoding: 'utf-8',
});
