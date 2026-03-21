import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { replaceActiveRepeatableQuestRewards } from './replace_active_repeatable_quest_rewards.ts';
import type { RepeatableQuestRewardInput } from './types.ts';

/**
 * Replaces the active reward templates on a repeatable quest definition.
 */
export function replaceRepeatableQuestRewards(
	db: QuestlogDb,
	repeatableQuestId: number,
	rewards: RepeatableQuestRewardInput[],
	now?: number,
): void {
	assertActiveRowExists(db, 'repeatable_quests', repeatableQuestId, 'Repeatable quest');
	replaceActiveRepeatableQuestRewards(db, repeatableQuestId, rewards, now);
	db.prepare('UPDATE repeatable_quests SET updated_at = ? WHERE id = ?').run(
		resolveNow(now),
		repeatableQuestId,
	);
}
