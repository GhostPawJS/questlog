import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { withTransaction } from '../with_transaction';
import { addUnlock } from './add_unlock';

/**
 * Replaces the active prerequisites for a target quest.
 */
export function replaceUnlocks(
	db: QuestlogDb,
	toQuestId: number,
	fromQuestIds: number[],
	now?: number,
): void {
	withTransaction(db, () => {
		db.prepare(
			`UPDATE quest_unlocks
       SET deleted_at = ?
       WHERE to_quest_id = ? AND deleted_at IS NULL`,
		).run(resolveNow(now), toQuestId);

		for (const fromQuestId of [...new Set(fromQuestIds)]) {
			addUnlock(db, fromQuestId, toQuestId, now);
		}
	});
}
