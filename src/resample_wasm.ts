import { resample } from '../build/release.js';
import { Interpolation } from './constants.js';

export function resampleWASM(
	input: Float32Array,
	output: Float32Array,
	interpolation: Interpolation,
	tolerance = 1e4,
	normalized = false
): number {
	return resample(input, output, interpolation, tolerance, normalized);
}
