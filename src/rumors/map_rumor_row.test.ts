import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapRumorRow } from './map_rumor_row';

describe('mapRumorRow', () => {
	it('maps an open rumor with optional details', () => {
		const r = mapRumorRow({
			id: 1,
			title: 'Idea',
			details: 'More context',
			created_at: 10,
			updated_at: 10,
			settled_at: null,
			dismissed_at: null,
			deleted_at: null,
		});
		strictEqual(r.title, 'Idea');
		strictEqual(r.details, 'More context');
		strictEqual(r.settledAt, null);
	});

	it('maps null details to null, not the string "null"', () => {
		const r = mapRumorRow({
			id: 2,
			title: 'T',
			details: null,
			created_at: 1,
			updated_at: 2,
			settled_at: null,
			dismissed_at: null,
			deleted_at: null,
		});
		strictEqual(r.details, null);
	});
});
