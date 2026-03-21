import type { QuestlogDb } from '../database.ts';
import { mapQuestRewardRow } from './map_quest_reward_row.ts';
import type { QuestReward } from './types.ts';

/**
 * Loads a single active quest reward or throws.
 */
export function getQuestRewardOrThrow(db: QuestlogDb, rewardId: number): QuestReward {
	const row = db
		.prepare('SELECT * FROM quest_rewards WHERE id = ? AND deleted_at IS NULL')
		.get(rewardId);
	if (!row) {
		throw new Error(`Quest reward ${rewardId} was not found.`);
	}
	return mapQuestRewardRow(row);
}
