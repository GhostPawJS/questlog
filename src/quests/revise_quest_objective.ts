import { assertNonEmpty } from '../assert_non_empty';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getQuestOrThrow } from './get_quest_or_throw';
import type { Quest } from './types';

/**
 * Revises a quest objective while the quest has not actually started.
 */
export function reviseQuestObjective(
	db: QuestlogDb,
	questId: number,
	objective: string,
	now?: number,
): Quest {
	const current = getQuestOrThrow(db, questId);
	if (current.startedAt != null) {
		throw new Error('Quest objective cannot change after the quest has actually started.');
	}
	db.prepare(
		`UPDATE quests
     SET objective = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(assertNonEmpty(objective, 'Quest objective'), resolveNow(now), questId);
	return getQuestOrThrow(db, questId);
}
