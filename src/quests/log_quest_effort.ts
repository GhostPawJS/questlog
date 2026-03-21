import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getQuestOrThrow } from './get_quest_or_throw';
import type { Quest } from './types';

/**
 * Adds active effort time to a quest.
 */
export function logQuestEffort(
	db: QuestlogDb,
	questId: number,
	effortSeconds: number,
	now?: number,
): Quest {
	if (effortSeconds <= 0) {
		throw new Error('Quest effort increment must be greater than zero.');
	}
	getQuestOrThrow(db, questId);
	db.prepare(
		`UPDATE quests
     SET effort_seconds = effort_seconds + ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(effortSeconds, resolveNow(now), questId);
	return getQuestOrThrow(db, questId);
}
