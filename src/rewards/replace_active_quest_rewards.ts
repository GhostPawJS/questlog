import { assertNonEmpty } from '../assert_non_empty.ts';
import { assertNonNegativeNumber } from '../assert_non_negative_number.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import type { QuestRewardInput } from './types.ts';

/**
 * Replaces all active rewards attached to a concrete quest.
 */
export function replaceActiveQuestRewards(
	db: QuestlogDb,
	questId: number,
	rewards: QuestRewardInput[],
	now?: number,
): void {
	const effectiveNow = resolveNow(now);
	db.prepare(
		'UPDATE quest_rewards SET deleted_at = ? WHERE quest_id = ? AND deleted_at IS NULL',
	).run(effectiveNow, questId);

	for (const reward of rewards) {
		db.prepare(
			`INSERT INTO quest_rewards (quest_id, kind, name, description, quantity, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
		).run(
			questId,
			assertNonEmpty(reward.kind, 'Reward kind'),
			assertNonEmpty(reward.name, 'Reward name'),
			reward.description?.trim() || null,
			assertNonNegativeNumber(reward.quantity, 'Reward quantity') ?? null,
			effectiveNow,
		);
	}
}
