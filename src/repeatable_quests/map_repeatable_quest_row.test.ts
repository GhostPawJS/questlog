import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapRepeatableQuestRow } from './map_repeatable_quest_row.ts';

describe('mapRepeatableQuestRow', () => {
	it('maps boolean all_day from 0/1 integers', () => {
		const off = mapRepeatableQuestRow({
			id: 1,
			questline_id: null,
			title: 't',
			objective: 'o',
			rrule: 'FREQ=DAILY',
			anchor_at: 1000,
			not_before_offset_seconds: null,
			due_offset_seconds: 3600,
			scheduled_start_offset_seconds: null,
			scheduled_end_offset_seconds: null,
			all_day: 0,
			estimate_seconds: null,
			created_at: 1,
			updated_at: 2,
			archived_at: null,
			deleted_at: null,
		});
		strictEqual(off.allDay, false);

		const on = mapRepeatableQuestRow({
			id: 2,
			questline_id: null,
			title: 't',
			objective: 'o',
			rrule: 'FREQ=DAILY',
			anchor_at: 1000,
			not_before_offset_seconds: null,
			due_offset_seconds: 3600,
			scheduled_start_offset_seconds: null,
			scheduled_end_offset_seconds: null,
			all_day: 1,
			estimate_seconds: null,
			created_at: 1,
			updated_at: 2,
			archived_at: null,
			deleted_at: null,
		});
		strictEqual(on.allDay, true);
	});

	it('carries RRULE and anchor as opaque strings and numbers', () => {
		const rq = mapRepeatableQuestRow({
			id: 2,
			questline_id: 5,
			title: 'Daily',
			objective: 'Do it',
			rrule: 'FREQ=WEEKLY;BYDAY=MO',
			anchor_at: 50_000,
			not_before_offset_seconds: 10,
			due_offset_seconds: null,
			scheduled_start_offset_seconds: 0,
			scheduled_end_offset_seconds: 3600,
			all_day: 0,
			estimate_seconds: 120,
			created_at: 1,
			updated_at: 2,
			archived_at: null,
			deleted_at: null,
		});
		strictEqual(rq.rrule, 'FREQ=WEEKLY;BYDAY=MO');
		strictEqual(rq.questlineId, 5);
		strictEqual(rq.dueOffsetSeconds, null);
	});
});
