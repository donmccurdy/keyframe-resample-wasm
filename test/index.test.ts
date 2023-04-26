import test from 'ava';
import { resample, resampleWASM } from 'keyframe-resample';

test('resample', (t) => {
	t.is(!!resample, true, 'js build exists');
});

test('resample wasm', (t) => {
	t.is(!!resampleWASM, true, 'wasm build exists');
});
