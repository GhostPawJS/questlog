import { assertActiveRowExists } from '../assert_active_row_exists';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';

/**
 * Soft-deletes a questline.
 */
export function softDeleteQuestline(db: QuestlogDb, questlineId: number, deletedAt?: number): void {
	const now = resolveNow(deletedAt);
	assertActiveRowExists(db, 'questlines', questlineId, 'Questline');
	db.prepare(
		'UPDATE questlines SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
	).run(now, now, questlineId);
}
