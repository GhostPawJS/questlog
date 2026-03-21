import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapQuestRewardRow } from './map_quest_reward_row';

describe('mapQuestRewardRow', () => {
	it('maps an unclaimed reward with optional description and quantity', () => {
		const rw = mapQuestRewardRow({
			id: 4,
			quest_id: 9,
			kind: 'xp',
			name: 'Bonus',
			description: null,
			quantity: 100,
			created_at: 1,
			claimed_at: null,
			deleted_at: null,
		});
		strictEqual(rw.questId, 9);
		strictEqual(rw.claimedAt, null);
		strictEqual(rw.quantity, 100);
	});

	it('maps claimed rewards with a claim timestamp', () => {
		const rw = mapQuestRewardRow({
			id: 1,
			quest_id: 1,
			kind: 'item',
			name: 'Potion',
			description: 'Heals',
			quantity: 2,
			created_at: 1,
			claimed_at: 99,
			deleted_at: null,
		});
		strictEqual(rw.claimedAt, 99);
	});
});
