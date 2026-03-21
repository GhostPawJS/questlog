import { assertNonEmpty } from '../assert_non_empty.ts';
import { assertNonNegativeSeconds } from '../assert_non_negative_seconds.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { withTransaction } from '../with_transaction.ts';
import { getRepeatableQuestOrThrow } from './get_repeatable_quest_or_throw.ts';
import { parseRRule } from './parse_rrule.ts';
import type { RepeatableQuest, UpdateRepeatableQuestInput } from './types.ts';

/**
 * Updates a repeatable quest definition for future materializations only.
 */
export function updateRepeatableQuest(
	db: QuestlogDb,
	repeatableQuestId: number,
	input: UpdateRepeatableQuestInput,
): RepeatableQuest {
	return withTransaction(db, () => {
		const current = getRepeatableQuestOrThrow(db, repeatableQuestId);
		const now = resolveNow(input.now);
		const rrule = input.rrule ?? current.rrule;

		parseRRule(rrule);

		db.prepare(
			`UPDATE repeatable_quests
       SET questline_id = ?,
           title = ?,
           objective = ?,
           rrule = ?,
           anchor_at = ?,
           not_before_offset_seconds = ?,
           due_offset_seconds = ?,
           scheduled_start_offset_seconds = ?,
           scheduled_end_offset_seconds = ?,
           all_day = ?,
           estimate_seconds = ?,
           archived_at = ?,
           updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
		).run(
			input.questlineId === undefined ? current.questlineId : input.questlineId,
			input.title == null ? current.title : assertNonEmpty(input.title, 'Repeatable quest title'),
			input.objective == null
				? current.objective
				: assertNonEmpty(input.objective, 'Repeatable quest objective'),
			rrule,
			input.anchorAt ?? current.anchorAt,
			input.notBeforeOffsetSeconds === undefined
				? current.notBeforeOffsetSeconds
				: (assertNonNegativeSeconds(input.notBeforeOffsetSeconds, 'Repeatable not-before offset') ??
						null),
			input.dueOffsetSeconds === undefined
				? current.dueOffsetSeconds
				: (assertNonNegativeSeconds(input.dueOffsetSeconds, 'Repeatable due offset') ?? null),
			input.scheduledStartOffsetSeconds === undefined
				? current.scheduledStartOffsetSeconds
				: input.scheduledStartOffsetSeconds,
			input.scheduledEndOffsetSeconds === undefined
				? current.scheduledEndOffsetSeconds
				: input.scheduledEndOffsetSeconds,
			input.allDay === undefined ? (current.allDay ? 1 : 0) : input.allDay ? 1 : 0,
			input.estimateSeconds === undefined
				? current.estimateSeconds
				: (assertNonNegativeSeconds(input.estimateSeconds, 'Repeatable estimate') ?? null),
			input.archivedAt === undefined ? current.archivedAt : input.archivedAt,
			now,
			repeatableQuestId,
		);

		return getRepeatableQuestOrThrow(db, repeatableQuestId);
	});
}
