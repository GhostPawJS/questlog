import { assertNonEmpty } from '../assert_non_empty.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';
import { getQuestlineOrThrow } from './get_questline_or_throw.ts';
import type { Questline, UpdateQuestlineInput } from './types.ts';

/**
 * Updates mutable questline fields.
 */
export function updateQuestline(
	db: QuestlogDb,
	questlineId: number,
	input: UpdateQuestlineInput,
): Questline {
	return withTransaction(db, () => {
		const current = getQuestlineOrThrow(db, questlineId);
		const now = resolveNow(input.now);

		db.prepare(
			`UPDATE questlines
       SET title = ?,
           description = ?,
           starts_at = ?,
           due_at = ?,
           archived_at = ?,
           updated_at = ?
       WHERE id = ?`,
		).run(
			input.title == null ? current.title : assertNonEmpty(input.title, 'Questline title'),
			input.description === undefined ? current.description : input.description?.trim() || null,
			input.startsAt === undefined ? current.startsAt : input.startsAt,
			input.dueAt === undefined ? current.dueAt : input.dueAt,
			input.archivedAt === undefined ? current.archivedAt : input.archivedAt,
			now,
			questlineId,
		);

		return getQuestlineOrThrow(db, questlineId);
	});
}
