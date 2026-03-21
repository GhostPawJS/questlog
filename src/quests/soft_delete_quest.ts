import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getQuestOrThrow } from './get_quest_or_throw';

/**
 * Soft-deletes a quest.
 */
export function softDeleteQuest(db: QuestlogDb, questId: number, now?: number): void {
	const deletedAt = resolveNow(now);
	getQuestOrThrow(db, questId);
	db.prepare(
		`UPDATE quests
     SET deleted_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(deletedAt, deletedAt, questId);
}
