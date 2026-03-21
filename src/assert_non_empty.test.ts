import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertNonEmpty } from './assert_non_empty.ts';

describe('assertNonEmpty', () => {
	it('returns trimmed string when non-empty', () => {
		strictEqual(assertNonEmpty('  hello  ', 'Label'), 'hello');
	});

	it('throws on empty and whitespace-only strings', () => {
		throws(() => assertNonEmpty('', 'Title'), /Title must not be empty/);
		throws(() => assertNonEmpty('   \t\n', 'Title'), /Title must not be empty/);
	});
});
