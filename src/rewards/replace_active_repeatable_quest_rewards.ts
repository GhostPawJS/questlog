import { assertNonEmpty } from '../assert_non_empty.ts';
import { assertNonNegativeNumber } from '../assert_non_negative_number.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import type { RepeatableQuestRewardInput } from './types.ts';

/**
 * Replaces all active reward templates attached to a repeatable quest.
 */
export function replaceActiveRepeatableQuestRewards(
	db: QuestlogDb,
	repeatableQuestId: number,
	rewards: RepeatableQuestRewardInput[],
	now?: number,
): void {
	const effectiveNow = resolveNow(now);
	db.prepare(
		'UPDATE repeatable_quest_rewards SET deleted_at = ? WHERE repeatable_quest_id = ? AND deleted_at IS NULL',
	).run(effectiveNow, repeatableQuestId);

	for (const reward of rewards) {
		db.prepare(
			`INSERT INTO repeatable_quest_rewards (
         repeatable_quest_id,
         kind,
         name,
         description,
         quantity,
         created_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
		).run(
			repeatableQuestId,
			assertNonEmpty(reward.kind, 'Reward kind'),
			assertNonEmpty(reward.name, 'Reward name'),
			reward.description?.trim() || null,
			assertNonNegativeNumber(reward.quantity, 'Reward quantity') ?? null,
			effectiveNow,
		);
	}
}
