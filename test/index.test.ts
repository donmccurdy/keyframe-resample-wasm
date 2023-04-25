import test from 'ava';
import { resample } from 'keyframe-resample';

test('resample', (t) => {
	t.is(!!resample, true, 'package exists');
});
