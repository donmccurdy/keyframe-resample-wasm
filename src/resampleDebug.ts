import { Interpolation, EPSILON } from './constants.js';

type quat = [number, number, number, number];

/* Implementation */

export function resampleDebug(
	input: Float32Array,
	output: Float32Array,
	interpolation: Interpolation,
	tolerance = 1e-4
): number {
	const elementSize = output.length / input.length;
	const tmp = new Array<number>(elementSize).fill(0);
	const value = new Array<number>(elementSize).fill(0);
	const valueNext = new Array<number>(elementSize).fill(0);
	const valuePrev = new Array<number>(elementSize).fill(0);

	const lastIndex = input.length - 1;
	let writeIndex = 1;

	for (let i = 1; i < lastIndex; ++i) {
		const timePrev = input[writeIndex - 1];
		const time = input[i];
		const timeNext = input[i + 1];
		const t = (time - timePrev) / (timeNext - timePrev);

		let keep = false;

		// Remove unnecessary adjacent keyframes.
		if (time !== timeNext && (i !== 1 || time !== input[0])) {
			getElement(output, writeIndex - 1, valuePrev);
			getElement(output, i, value);
			getElement(output, i + 1, valueNext);

			if (interpolation === 'slerp') {
				// Prune keyframes colinear with prev/next keyframes.
				const sample = slerp(
					tmp as quat,
					valuePrev as quat,
					valueNext as quat,
					t
				) as number[];
				const angle =
					getAngle(valuePrev as quat, value as quat) +
					getAngle(value as quat, valueNext as quat);
				keep = !eq(value, sample, tolerance) || angle + Number.EPSILON >= Math.PI;
			} else if (interpolation === 'lerp') {
				// Prune keyframes colinear with prev/next keyframes.
				const sample = vlerp(tmp, valuePrev, valueNext, t);
				keep = !eq(value, sample, tolerance);
			} else if (interpolation === 'step') {
				// Prune keyframes identical to prev/next keyframes.
				keep = !eq(value, valuePrev) || !eq(value, valueNext);
			}
		}

		// In-place compaction.
		if (keep) {
			if (i !== writeIndex) {
				input[writeIndex] = input[i];
				setElement(output, writeIndex, getElement(output, i, tmp));
			}
			writeIndex++;
		}
	}

	// Flush last keyframe (compaction looks ahead).
	if (lastIndex > 0) {
		input[writeIndex] = input[lastIndex];
		setElement(output, writeIndex, getElement(output, lastIndex, tmp));
		writeIndex++;
	}

	return writeIndex;
}

/* Utilities */

function getElement(array: Float32Array, index: number, target: number[]): number[] {
	for (let i = 0, elementSize = target.length; i < elementSize; i++) {
		target[i] = array[index * elementSize + i];
	}
	return target;
}

function setElement(array: Float32Array, index: number, value: number[]): void {
	for (let i = 0, elementSize = value.length; i < elementSize; i++) {
		array[index * elementSize + i] = value[i];
	}
}

function eq(a: number[], b: number[], tolerance = 0): boolean {
	if (a.length !== b.length) {
		return false;
	}

	for (let i = 0; i < a.length; i++) {
		if (Math.abs(a[i] - b[i]) > tolerance) {
			return false;
		}
	}

	return true;
}

function lerp(v0: number, v1: number, t: number): number {
	return v0 * (1 - t) + v1 * t;
}

function vlerp(out: number[], a: number[], b: number[], t: number): number[] {
	for (let i = 0; i < a.length; i++) out[i] = lerp(a[i], b[i], t);
	return out;
}

// From gl-matrix.
function slerp(out: quat, a: quat, b: quat, t: number): quat {
	// benchmarks:
	//    http://jsperf.com/quaternion-slerp-implementations
	let ax = a[0],
		ay = a[1],
		az = a[2],
		aw = a[3];
	let bx = b[0],
		by = b[1],
		bz = b[2],
		bw = b[3];

	let omega, cosom, sinom, scale0, scale1;

	// calc cosine
	cosom = ax * bx + ay * by + az * bz + aw * bw;
	// adjust signs (if necessary)
	if (cosom < 0.0) {
		cosom = -cosom;
		bx = -bx;
		by = -by;
		bz = -bz;
		bw = -bw;
	}
	// calculate coefficients
	if (1.0 - cosom > EPSILON) {
		// standard case (slerp)
		omega = Math.acos(cosom);
		sinom = Math.sin(omega);
		scale0 = Math.sin((1.0 - t) * omega) / sinom;
		scale1 = Math.sin(t * omega) / sinom;
	} else {
		// "from" and "to" quaternions are very close
		//  ... so we can do a linear interpolation
		scale0 = 1.0 - t;
		scale1 = t;
	}
	// calculate final values
	out[0] = scale0 * ax + scale1 * bx;
	out[1] = scale0 * ay + scale1 * by;
	out[2] = scale0 * az + scale1 * bz;
	out[3] = scale0 * aw + scale1 * bw;

	return out;
}

function getAngle(a: quat, b: quat): number {
	const dotproduct = dot(a, b);
	return Math.acos(2 * dotproduct * dotproduct - 1);
}

function dot(a: quat, b: quat): number {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
