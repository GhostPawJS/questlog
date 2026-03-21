import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { getRumorOrThrow } from './get_rumor_or_throw.ts';
import type { Rumor } from './types.ts';

/**
 * Dismisses a rumor without producing downstream artifacts.
 */
export function dismissRumor(db: QuestlogDb, rumorId: number, dismissedAt?: number): Rumor {
	const now = resolveNow(dismissedAt);
	assertActiveRowExists(db, 'rumors', rumorId, 'Rumor');
	db.prepare(
		`UPDATE rumors
     SET dismissed_at = ?, settled_at = NULL, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(now, now, rumorId);
	return getRumorOrThrow(db, rumorId);
}
