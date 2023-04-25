import test from 'ava';
import { resample } from 'keyframe-resample';
import { resample as resampleWASM } from '../build/debug.js';

test('resample', (t) => {
	t.is(!!resample, true, 'js build exists');
});

test('resample wasm', (t) => {
	t.is(!!resampleWASM, true, 'wasm build exists');
});
