import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapTagRow } from './map_tag_row.ts';

describe('mapTagRow', () => {
	it('preserves display name and normalized key as separate fields', () => {
		const t = mapTagRow({
			id: 1,
			name: 'Deep Work',
			normalized_name: 'deep work',
			created_at: 5,
			deleted_at: null,
		});
		strictEqual(t.name, 'Deep Work');
		strictEqual(t.normalizedName, 'deep work');
		strictEqual(t.deletedAt, null);
	});

	it('stringifies ids from sqlite for stable domain numbers', () => {
		const t = mapTagRow({
			id: '12',
			name: 'x',
			normalized_name: 'x',
			created_at: 0,
			deleted_at: null,
		});
		strictEqual(t.id, 12);
	});
});
