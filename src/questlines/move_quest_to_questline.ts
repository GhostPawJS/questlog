import { assertActiveRowExists } from '../assert_active_row_exists';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';

/**
 * Moves a quest into a questline.
 */
export function moveQuestToQuestline(
	db: QuestlogDb,
	questId: number,
	questlineId: number,
	now?: number,
): void {
	assertActiveRowExists(db, 'quests', questId, 'Quest');
	assertActiveRowExists(db, 'questlines', questlineId, 'Questline');
	db.prepare(
		'UPDATE quests SET questline_id = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
	).run(questlineId, resolveNow(now), questId);
}
