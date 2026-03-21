import { assertActiveRowExists } from '../assert_active_row_exists';
import { assertNonEmpty } from '../assert_non_empty';
import { assertNonNegativeNumber } from '../assert_non_negative_number';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getQuestRewardOrThrow } from './get_quest_reward_or_throw';
import type { QuestReward, QuestRewardInput } from './types';

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
