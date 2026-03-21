import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { advanceAnchor } from './advance_anchor.ts';

describe('advanceAnchor', () => {
	it('advances WEEKLY by interval * 7 days in ms', () => {
		const a = Date.UTC(2024, 0, 1);
		const next = advanceAnchor(a, 'WEEKLY', 2);
		strictEqual(next - a, 2 * 7 * 86_400_000);
	});

	it('advances MONTHLY via calendar month', () => {
		const a = Date.UTC(2024, 0, 15);
		const next = advanceAnchor(a, 'MONTHLY', 1);
		const d = new Date(next);
		strictEqual(d.getUTCMonth(), 1);
	});

	it('advances YEARLY via calendar year', () => {
		const a = Date.UTC(2024, 5, 10);
		const next = advanceAnchor(a, 'YEARLY', 1);
		strictEqual(new Date(next).getUTCFullYear(), 2025);
	});
});
