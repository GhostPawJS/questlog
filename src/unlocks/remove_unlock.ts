import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';

/**
 * Removes an active unlock relation.
 */
export function removeUnlock(
	db: QuestlogDb,
	fromQuestId: number,
	toQuestId: number,
	now?: number,
): void {
	db.prepare(
		`UPDATE quest_unlocks
     SET deleted_at = ?
     WHERE from_quest_id = ? AND to_quest_id = ? AND deleted_at IS NULL`,
	).run(resolveNow(now), fromQuestId, toQuestId);
}
