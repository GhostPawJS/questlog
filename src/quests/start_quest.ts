import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getQuestOrThrow } from './get_quest_or_throw';
import type { Quest } from './types';

/**
 * Marks actual work on a quest as started.
 */
export function startQuest(db: QuestlogDb, questId: number, startedAt?: number): Quest {
	const current = getQuestOrThrow(db, questId);
	if (current.startedAt != null) {
		return current;
	}
	if (current.resolvedAt != null) {
		throw new Error('Resolved quests cannot be started.');
	}
	const now = resolveNow(startedAt);
	db.prepare(
		`UPDATE quests
     SET started_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(now, now, questId);
	return getQuestOrThrow(db, questId);
}
