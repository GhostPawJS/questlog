import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertNonNegativeSeconds } from './assert_non_negative_seconds';

describe('assertNonNegativeSeconds', () => {
	it('allows null, undefined, and non-negative integers', () => {
		strictEqual(assertNonNegativeSeconds(null, 'x'), null);
		strictEqual(assertNonNegativeSeconds(undefined, 'x'), undefined);
		strictEqual(assertNonNegativeSeconds(0, 'x'), 0);
	});

	it('throws on negative seconds', () => {
		throws(
			() => assertNonNegativeSeconds(-1, 'Quest estimate'),
			/Quest estimate must not be negative/,
		);
	});
});
