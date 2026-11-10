import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeCalendarInputs } from './calendar_inputs.ts';
import { parseCalendarTime } from './parse_calendar_time.ts';

test('calendar grammar retains Affinity UTC day boundaries and zone-relative days', () => {
	const now = Date.parse('2026-11-10T00:30:00Z');
	for (const field of ['dueAt', 'scheduledStartAt', 'scheduledEndAt']) {
		const end = field === 'dueAt' ? 86399999 : 0;
		for (const value of ['2026-11-10', '10.11.2026', 'today'])
			assert.equal(
				parseCalendarTime(value, field, now, 'Europe/Berlin').timestamp,
				Date.parse('2026-11-10') + end,
			);
		assert.equal(
			parseCalendarTime('tomorrow', field, now, 'America/New_York').timestamp,
			Date.parse('2026-11-10') + end,
		);
		assert.equal(
			parseCalendarTime('+3d', field, now, 'America/New_York').timestamp,
			Date.parse('2026-11-12') + end,
		);
		assert.equal(parseCalendarTime('+2h', field, now).timestamp, now + 7200000);
		assert.equal(parseCalendarTime(now, field).timestamp, now);
		assert.equal(
			parseCalendarTime('2026-11-10T09:00:00+01:00', field).timestamp,
			Date.parse('2026-11-10T08:00:00Z'),
		);
		for (const value of [1, 1794268800, 999999999999])
			assert.throws(() => parseCalendarTime(value, field), /epoch milliseconds.*not seconds/);
		for (const value of ['2026-02-30', 'nonsense', 1.5e12 + 0.5, NaN, Infinity])
			assert.throws(() => parseCalendarTime(value, field), /expected/);
	}
	assert.equal(
		parseCalendarTime('tomorrow', 'dueAt', Date.parse('2026-03-28T23:30:00Z'), 'Europe/Berlin')
			.timestamp,
		Date.parse('2026-03-30T23:59:59.999Z'),
	);
	assert.throws(
		() => normalizeCalendarInputs({ tz: 'Invalid/Zone', quest: { dueAt: 'today' } }),
		/time zone/i,
	);
	const frozen = Object.freeze({ tz: 'UTC', quest: Object.freeze({ dueAt: 'today', now }) });
	assert.equal(normalizeCalendarInputs(frozen).quest.dueAt, Date.parse('2026-11-10T23:59:59.999Z'));
	assert.equal(frozen.quest.dueAt, 'today');
});
