import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';

/**
 * Soft-deletes a rumor.
 */
export function softDeleteRumor(db: QuestlogDb, rumorId: number, now?: number): void {
	const deletedAt = resolveNow(now);
	assertActiveRowExists(db, 'rumors', rumorId, 'Rumor');
	db.prepare(
		`UPDATE rumors
     SET deleted_at = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(deletedAt, deletedAt, rumorId);
}
