import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import { assertNonEmpty } from '../assert_non_empty.ts';
import { assertNonNegativeNumber } from '../assert_non_negative_number.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { getQuestRewardOrThrow } from './get_quest_reward_or_throw.ts';
import type { QuestReward, QuestRewardInput } from './types.ts';

/**
 * Attaches a reward to a concrete quest.
 */
export function addQuestReward(
	db: QuestlogDb,
	questId: number,
	input: QuestRewardInput,
): QuestReward {
	assertActiveRowExists(db, 'quests', questId, 'Quest');
	const now = resolveNow(input.now);
	const created = db
		.prepare(
			`INSERT INTO quest_rewards (quest_id, kind, name, description, quantity, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
		)
		.run(
			questId,
			assertNonEmpty(input.kind, 'Reward kind'),
			assertNonEmpty(input.name, 'Reward name'),
			input.description?.trim() || null,
			assertNonNegativeNumber(input.quantity, 'Reward quantity') ?? null,
			now,
		);
	return getQuestRewardOrThrow(db, Number(created.lastInsertRowid));
}
