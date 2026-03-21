import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { startOfUtcWeek } from './start_of_utc_week';

describe('startOfUtcWeek', () => {
	it('returns Sunday 00:00 UTC for that week given a day boundary', () => {
		const dayStart = Date.UTC(2024, 5, 12);
		const weekStart = startOfUtcWeek(dayStart);
		const d = new Date(weekStart);
		strictEqual(d.getUTCDay(), 0);
		strictEqual(d.getUTCHours(), 0);
	});
});
