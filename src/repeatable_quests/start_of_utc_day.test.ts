import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { startOfUtcDay } from './start_of_utc_day';

describe('startOfUtcDay', () => {
	it('normalizes to UTC midnight for that calendar day', () => {
		const t = Date.UTC(2024, 5, 15, 14, 30, 0, 123);
		strictEqual(startOfUtcDay(t), Date.UTC(2024, 5, 15));
	});
});
