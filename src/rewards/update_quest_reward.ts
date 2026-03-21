import { assertNonEmpty } from '../assert_non_empty';
import { assertNonNegativeNumber } from '../assert_non_negative_number';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getQuestRewardOrThrow } from './get_quest_reward_or_throw';
import type { QuestReward, QuestRewardInput } from './types';

/**
 * Updates an unclaimed quest reward.
 */
export function updateQuestReward(
	db: QuestlogDb,
	rewardId: number,
	input: Omit<QuestRewardInput, 'now'> & { now?: number },
): QuestReward {
	const current = getQuestRewardOrThrow(db, rewardId);
	if (current.claimedAt != null) {
		throw new Error('Claimed rewards cannot be updated.');
	}
	const now = resolveNow(input.now);
	db.prepare(
		`UPDATE quest_rewards
     SET kind = ?, name = ?, description = ?, quantity = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(
		assertNonEmpty(input.kind, 'Reward kind'),
		assertNonEmpty(input.name, 'Reward name'),
		input.description?.trim() || null,
		assertNonNegativeNumber(input.quantity, 'Reward quantity') ?? null,
		rewardId,
	);
	db.prepare('UPDATE quests SET updated_at = ? WHERE id = ?').run(now, current.questId);
	return getQuestRewardOrThrow(db, rewardId);
}
