import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { getQuestRewardOrThrow } from './get_quest_reward_or_throw.ts';

/**
 * Soft-deletes an unclaimed reward.
 */
export function removeQuestReward(db: QuestlogDb, rewardId: number, now?: number): void {
	const current = getQuestRewardOrThrow(db, rewardId);
	if (current.claimedAt != null) {
		throw new Error('Claimed rewards cannot be removed.');
	}
	db.prepare(
		`UPDATE quest_rewards
     SET deleted_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(resolveNow(now), rewardId);
}
