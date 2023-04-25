/* Types and constants */

type quat = f32[];

export enum Interpolation {
	STEP = 0,
	LERP = 1,
	SLERP = 2,
}

const EPS = 0.000001;

/* Implementation */

export function resample(
	input: Float32Array,
	output: Float32Array,
	interpolation: Interpolation,
	tolerance: f32 = 1e4,
	normalized: boolean = false
): u32 {
	const elementSize: u32 = output.length / input.length;
	const tmp: f32[] = new Array<f32>(elementSize).fill(0);
	const value: f32[] = new Array<f32>(elementSize).fill(0);
	const valueNext: f32[] = new Array<f32>(elementSize).fill(0);
	const valuePrev: f32[] = new Array<f32>(elementSize).fill(0);

	const lastIndex: u32 = input.length - 1;
	let writeIndex: u32 = 1;

	for (let i: u32 = 1; i < lastIndex; ++i) {
		const timePrev: f32 = input[writeIndex - 1];
		const time: f32 = input[i];
		const timeNext: f32 = input[i + 1];
		const t: f32 = (time - timePrev) / (timeNext - timePrev);

		let keep = false;

		// Remove unnecessary adjacent keyframes.
		if (time !== timeNext && (i !== 1 || time !== input[0])) {
			getElement(output, writeIndex - 1, valuePrev, normalized);
			getElement(output, i, value, normalized);
			getElement(output, i + 1, valueNext, normalized);

			if (interpolation === Interpolation.SLERP) {
				// Prune keyframes colinear with prev/next keyframes.
				const sample: f32[] = slerp(tmp as quat, valuePrev as quat, valueNext as quat, t);
				const angle: f32 =
					getAngle(valuePrev as quat, value as quat) +
					getAngle(value as quat, valueNext as quat);
				keep = !eq(value, sample, tolerance) || angle + Number.EPSILON >= Math.PI;
			} else if (interpolation === Interpolation.LERP) {
				// Prune keyframes colinear with prev/next keyframes.
				const sample = vlerp(tmp, valuePrev, valueNext, t);
				keep = !eq(value, sample, tolerance);
			} else if (interpolation === Interpolation.STEP) {
				// Prune keyframes identical to prev/next keyframes.
				keep = !eq(value, valuePrev) || !eq(value, valueNext);
			}
		}

		// In-place compaction.
		if (keep) {
			if (i !== writeIndex) {
				input[writeIndex] = input[i];
				setElement(output, writeIndex, getElement(output, i, tmp, normalized), normalized);
			}
			writeIndex++;
		}
	}

	// Flush last keyframe (compaction looks ahead).
	if (lastIndex > 0) {
		input[writeIndex] = input[lastIndex];
		setElement(output, writeIndex, getElement(output, lastIndex, tmp, normalized), normalized);
		writeIndex++;
	}

	// If the sampler was optimized, truncate and save the results. If not, clean up.
	// if (writeIndex !== input.length) {
	// 	input = input.slice(0, writeIndex);
	// 	output = output.slice(0, writeIndex * elementSize);
	// }

	return writeIndex;
}

/* Utilities */

function getElement(array: Float32Array, index: u32, target: f32[], normalized: boolean): f32[] {
	// if (normalized) {
	// 	throw new Error('Normalization not supported.');
	// }
	for (let i = 0, elementSize = target.length; i < elementSize; i++) {
		target[i] = array[index * elementSize + i];
	}
	return target;
}

function setElement(array: Float32Array, index: u32, value: f32[], normalized: boolean): void {
	// if (normalized) {
	// 	throw new Error('Normalization not supported.');
	// }
	for (let i = 0, elementSize = value.length; i < elementSize; i++) {
		array[index * elementSize + i] = value[i];
	}
}

function eq(a: f32[], b: f32[], tolerance: f32 = 0): boolean {
	if (a.length !== b.length) {
		return false;
	}

	for (let i = 0; i < a.length; i++) {
		if (Mathf.abs(a[i] - b[i]) > tolerance) {
			return false;
		}
	}

	return true;
}

function lerp(v0: f32, v1: f32, t: f32): f32 {
	return v0 * (1 - t) + v1 * t;
}

function vlerp(out: f32[], a: f32[], b: f32[], t: f32): f32[] {
	for (let i = 0; i < a.length; i++) out[i] = lerp(a[i], b[i], t);
	return out;
}

// From gl-matrix.
function slerp(out: quat, a: quat, b: quat, t: f32): quat {
	// benchmarks:
	//    http://jsperf.com/quaternion-slerp-implementations
	let ax: f32 = a[0],
		ay: f32 = a[1],
		az: f32 = a[2],
		aw: f32 = a[3];
	let bx: f32 = b[0],
		by: f32 = b[1],
		bz: f32 = b[2],
		bw: f32 = b[3];

	let omega: f32, cosom: f32, sinom: f32, scale0: f32, scale1: f32;

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
	if (1.0 - cosom > EPS) {
		// standard case (slerp)
		omega = Mathf.acos(cosom);
		sinom = Mathf.sin(omega);
		scale0 = Mathf.sin((1.0 - t) * omega) / sinom;
		scale1 = Mathf.sin(t * omega) / sinom;
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

function getAngle(a: quat, b: quat): f32 {
	const dotproduct = dot(a, b);
	return Mathf.acos(2 * dotproduct * dotproduct - 1);
}

function dot(a: quat, b: quat): f32 {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
