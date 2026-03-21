import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { overlapsScheduleWindow } from './overlaps_schedule_window.ts';

describe('overlapsScheduleWindow', () => {
	it('returns false when start is null', () => {
		strictEqual(overlapsScheduleWindow(null, 100, 0, 200), false);
	});

	it('treats null end as start (instant event)', () => {
		strictEqual(overlapsScheduleWindow(50, null, 0, 200), true);
		strictEqual(overlapsScheduleWindow(50, null, 60, 200), false);
	});

	it('detects overlap boundaries (half-open style)', () => {
		strictEqual(overlapsScheduleWindow(100, 200, 150, 250), true);
		strictEqual(overlapsScheduleWindow(100, 200, 0, 99), false);
		strictEqual(overlapsScheduleWindow(100, 200, 200, 300), true);
	});
});
