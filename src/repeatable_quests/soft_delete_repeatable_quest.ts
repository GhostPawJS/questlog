import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { getRepeatableQuestOrThrow } from './get_repeatable_quest_or_throw.ts';

/**
 * Soft-deletes a repeatable quest definition.
 */
export function softDeleteRepeatableQuest(
	db: QuestlogDb,
	repeatableQuestId: number,
	deletedAt?: number,
): void {
	const now = resolveNow(deletedAt);
	getRepeatableQuestOrThrow(db, repeatableQuestId);
	db.prepare(
		`UPDATE repeatable_quests
     SET deleted_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(now, now, repeatableQuestId);
}
