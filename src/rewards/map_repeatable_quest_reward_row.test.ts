import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapRepeatableQuestRewardRow } from './map_repeatable_quest_reward_row.ts';

describe('mapRepeatableQuestRewardRow', () => {
	it('ties the reward to its repeatable template id', () => {
		const rw = mapRepeatableQuestRewardRow({
			id: 10,
			repeatable_quest_id: 3,
			kind: 'xp',
			name: 'Streak',
			description: null,
			quantity: 5,
			created_at: 1,
			deleted_at: null,
		});
		strictEqual(rw.repeatableQuestId, 3);
		strictEqual(rw.kind, 'xp');
	});
});
