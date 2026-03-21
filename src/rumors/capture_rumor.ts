import { assertNonEmpty } from '../assert_non_empty';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getRumorOrThrow } from './get_rumor_or_throw';
import type { CaptureRumorInput, Rumor } from './types';

/**
 * Captures a new rumor for later triage.
 */
export function captureRumor(db: QuestlogDb, input: CaptureRumorInput): Rumor {
	const now = resolveNow(input.now);
	const title = assertNonEmpty(input.title, 'Rumor title');
	const created = db
		.prepare(
			`INSERT INTO rumors (title, details, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
		)
		.run(title, input.details?.trim() || null, now, now);
	return getRumorOrThrow(db, Number(created.lastInsertRowid));
}
