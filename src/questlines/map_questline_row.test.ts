import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapQuestlineRow } from './map_questline_row.ts';

describe('mapQuestlineRow', () => {
	it('maps nullable FK and timestamp columns to null in the domain model', () => {
		const q = mapQuestlineRow({
			id: 3,
			source_rumor_id: null,
			title: 'Chain',
			description: null,
			starts_at: null,
			due_at: null,
			created_at: 10,
			updated_at: 20,
			archived_at: null,
			deleted_at: null,
		});
		strictEqual(q.id, 3);
		strictEqual(q.sourceRumorId, null);
		strictEqual(q.description, null);
		strictEqual(q.archivedAt, null);
	});

	it('coerces numeric ids and timestamps from sqlite dynamic typing', () => {
		const q = mapQuestlineRow({
			id: '9',
			source_rumor_id: '2',
			title: 'T',
			description: 'D',
			starts_at: '100',
			due_at: '200',
			created_at: 1,
			updated_at: 2,
			archived_at: null,
			deleted_at: null,
		});
		strictEqual(q.id, 9);
		strictEqual(q.sourceRumorId, 2);
		strictEqual(q.startsAt, 100);
		strictEqual(q.dueAt, 200);
	});
});
