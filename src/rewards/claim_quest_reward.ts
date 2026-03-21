import type { QuestlogDb } from '../database.ts';
import { getQuestOrThrow } from '../quests/get_quest_or_throw.ts';
import { resolveNow } from '../resolve_now.ts';
import { getQuestRewardOrThrow } from './get_quest_reward_or_throw.ts';
import type { QuestReward } from './types.ts';

/**
 * Claims a reward exactly once for a successfully resolved quest.
 */
export function claimQuestReward(
	db: QuestlogDb,
	rewardId: number,
	claimedAt?: number,
): QuestReward {
	const reward = getQuestRewardOrThrow(db, rewardId);
	if (reward.claimedAt != null) {
		throw new Error('Reward has already been claimed.');
	}
	const quest = getQuestOrThrow(db, reward.questId);
	if (quest.resolvedAt == null || quest.success !== true) {
		throw new Error('Rewards can only be claimed for successfully resolved quests.');
	}
	db.prepare(
		`UPDATE quest_rewards
     SET claimed_at = ?
     WHERE id = ? AND claimed_at IS NULL AND deleted_at IS NULL`,
	).run(resolveNow(claimedAt), rewardId);
	return getQuestRewardOrThrow(db, rewardId);
}
