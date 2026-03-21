import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapQuestRow } from './map_quest_row';

describe('mapQuestRow', () => {
	it('maps sqlite row shape to Quest with boolean coercion', () => {
		const quest = mapQuestRow({
			id: 7,
			questline_id: null,
			source_rumor_id: null,
			spawned_by_quest_id: null,
			spawned_from_repeatable_id: null,
			spawned_for_at: null,
			title: ' T ',
			objective: ' O ',
			outcome: null,
			created_at: 1,
			updated_at: 2,
			started_at: null,
			resolved_at: null,
			success: null,
			effort_seconds: 0,
			estimate_seconds: null,
			not_before_at: null,
			due_at: null,
			scheduled_start_at: null,
			scheduled_end_at: null,
			all_day: 0,
			deleted_at: null,
		});
		strictEqual(quest.id, 7);
		strictEqual(quest.title, ' T ');
		strictEqual(quest.allDay, false);
	});

	it('treats success 1 as true and 0 as false', () => {
		const done = mapQuestRow({
			id: 1,
			questline_id: null,
			source_rumor_id: null,
			spawned_by_quest_id: null,
			spawned_from_repeatable_id: null,
			spawned_for_at: null,
			title: 'x',
			objective: 'y',
			outcome: 'done',
			created_at: 1,
			updated_at: 2,
			started_at: 1,
			resolved_at: 3,
			success: 1,
			effort_seconds: 0,
			estimate_seconds: null,
			not_before_at: null,
			due_at: null,
			scheduled_start_at: null,
			scheduled_end_at: null,
			all_day: 1,
			deleted_at: null,
		});
		strictEqual(done.success, true);
		strictEqual(done.allDay, true);
	});
});
