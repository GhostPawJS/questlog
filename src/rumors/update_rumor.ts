import { assertNonEmpty } from '../assert_non_empty.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { getRumorOrThrow } from './get_rumor_or_throw.ts';
import type { Rumor, UpdateRumorInput } from './types.ts';

/**
 * Enriches an existing open rumor with a new title and/or details.
 * Advances updatedAt so downstream consumers can detect enrichment.
 * Throws if the rumor is settled, dismissed, or deleted.
 */
export function updateRumor(db: QuestlogDb, rumorId: number, input: UpdateRumorInput): Rumor {
	if (input.title == null && input.details == null) {
		throw new Error('At least one of title or details must be provided to update a rumor.');
	}

	const current = getRumorOrThrow(db, rumorId);

	if (current.settledAt != null) {
		throw new Error(`Rumor ${rumorId} is already settled and cannot be updated.`);
	}
	if (current.dismissedAt != null) {
		throw new Error(`Rumor ${rumorId} is dismissed and cannot be updated. Reopen it first.`);
	}

	const now = resolveNow(input.now);
	const nextTitle =
		input.title != null ? assertNonEmpty(input.title, 'Rumor title') : current.title;
	const nextDetails = input.details != null ? input.details.trim() || null : current.details;

	db.prepare(
		`UPDATE rumors
     SET title = ?, details = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(nextTitle, nextDetails, now, rumorId);

	return getRumorOrThrow(db, rumorId);
}
