import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';

/**
 * Detaches a quest from its questline.
 */
export function detachQuestFromQuestline(db: QuestlogDb, questId: number, now?: number): void {
	assertActiveRowExists(db, 'quests', questId, 'Quest');
	db.prepare(
		'UPDATE quests SET questline_id = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
	).run(resolveNow(now), questId);
}
