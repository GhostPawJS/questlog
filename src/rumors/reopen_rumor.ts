import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { getRumorOrThrow } from './get_rumor_or_throw.ts';
import type { Rumor } from './types.ts';

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
