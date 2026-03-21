import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import { assertNonEmpty } from '../assert_non_empty.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { getQuestlineOrThrow } from './get_questline_or_throw.ts';
import type { CreateQuestlineInput, Questline } from './types.ts';

/**
 * Creates a new questline.
 */
export function createQuestline(db: QuestlogDb, input: CreateQuestlineInput): Questline {
	const now = resolveNow(input.now);
	const title = assertNonEmpty(input.title, 'Questline title');

	if (input.sourceRumorId != null) {
		assertActiveRowExists(db, 'rumors', input.sourceRumorId, 'Rumor');
	}

	const created = db
		.prepare(
			`INSERT INTO questlines (
         source_rumor_id,
         title,
         description,
         starts_at,
         due_at,
         created_at,
         updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			input.sourceRumorId ?? null,
			title,
			input.description?.trim() || null,
			input.startsAt ?? null,
			input.dueAt ?? null,
			now,
			now,
		);

	return getQuestlineOrThrow(db, Number(created.lastInsertRowid));
}
