import { assertActiveRowExists } from '../assert_active_row_exists';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getRumorOrThrow } from './get_rumor_or_throw';
import type { Rumor } from './types';

/**
 * Reopens a previously dismissed or settled rumor.
 */
export function reopenRumor(db: QuestlogDb, rumorId: number, now?: number): Rumor {
	assertActiveRowExists(db, 'rumors', rumorId, 'Rumor');
	const effectiveNow = resolveNow(now);
	db.prepare(
		`UPDATE rumors
     SET settled_at = NULL, dismissed_at = NULL, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(effectiveNow, rumorId);
	return getRumorOrThrow(db, rumorId);
}
