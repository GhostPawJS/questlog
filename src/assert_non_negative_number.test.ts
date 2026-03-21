import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertNonNegativeNumber } from './assert_non_negative_number';

describe('assertNonNegativeNumber', () => {
	it('allows null, undefined, and non-negative numbers', () => {
		strictEqual(assertNonNegativeNumber(null, 'x'), null);
		strictEqual(assertNonNegativeNumber(undefined, 'x'), undefined);
		strictEqual(assertNonNegativeNumber(0, 'x'), 0);
		strictEqual(assertNonNegativeNumber(3.5, 'x'), 3.5);
	});

	it('throws on negative finite values', () => {
		throws(() => assertNonNegativeNumber(-1, 'Offset'), /Offset must not be negative/);
		throws(() => assertNonNegativeNumber(-0.0001, 'Offset'), /Offset must not be negative/);
	});
});
