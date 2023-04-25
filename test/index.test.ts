import test from 'ava';
import { myPackage } from 'my-package';

test('my-package', (t) => {
	t.is(myPackage(), true, 'package exists');
});
