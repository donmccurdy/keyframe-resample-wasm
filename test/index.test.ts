import test from 'ava';
import { ready, resample, resampleDebug } from 'keyframe-resample';

const round = (value: number) => Math.round(value * 1e6) / 1e6;

test('init - debug', async (t) => {
	t.is(!!resampleDebug, true, 'js build exists');
});

test('init - wasm', async (t) => {
	await ready;
	t.is(!!resample, true, 'wasm build exists');
});

test('resample - debug', async (t) => {
	const srcTimes = new Float32Array([0, 0.1, 0.2, 0.3, 0.4]);
	const srcValues = new Float32Array([0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0, 5]);

	const count = resampleDebug(srcTimes, srcValues, 'lerp');

	const dstTimes = Array.from(srcTimes.slice(0, count)).map(round);
	const dstValues = Array.from(srcValues.slice(0, count * 3)).map(round);

	t.is(count, 2);
	t.deepEqual(dstTimes, [0, 0.4], 'times');
	t.deepEqual(dstValues, [0, 0, 1, 0, 0, 5], 'values');
});

test('resample - wasm', async (t) => {
	await ready;

	const srcTimes = new Float32Array([0, 0.1, 0.2, 0.3, 0.4]);
	const srcValues = new Float32Array([0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0, 5]);

	const count = resample(srcTimes, srcValues, 'lerp');

	const dstTimes = Array.from(srcTimes.slice(0, count)).map(round);
	const dstValues = Array.from(srcValues.slice(0, count * 3)).map(round);

	t.is(count, 2);
	t.deepEqual(dstTimes, [0, 0.4], 'times');
	t.deepEqual(dstValues, [0, 0, 1, 0, 0, 5], 'values');
});
