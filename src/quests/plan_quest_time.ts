import { assertNonNegativeSeconds } from '../assert_non_negative_seconds';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { getQuestOrThrow } from './get_quest_or_throw';
import type { PlanQuestTimeInput, Quest } from './types';

/**
 * Updates a quest's temporal planning fields.
 */
export function planQuestTime(db: QuestlogDb, questId: number, input: PlanQuestTimeInput): Quest {
	const current = getQuestOrThrow(db, questId);
	const now = resolveNow(input.now);

	db.prepare(
		`UPDATE quests
     SET not_before_at = ?,
         due_at = ?,
         scheduled_start_at = ?,
         scheduled_end_at = ?,
         all_day = ?,
         estimate_seconds = ?,
         updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
	).run(
		input.notBeforeAt === undefined ? current.notBeforeAt : input.notBeforeAt,
		input.dueAt === undefined ? current.dueAt : input.dueAt,
		input.scheduledStartAt === undefined ? current.scheduledStartAt : input.scheduledStartAt,
		input.scheduledEndAt === undefined ? current.scheduledEndAt : input.scheduledEndAt,
		input.allDay === undefined ? (current.allDay ? 1 : 0) : input.allDay ? 1 : 0,
		input.estimateSeconds === undefined
			? current.estimateSeconds
			: (assertNonNegativeSeconds(input.estimateSeconds, 'Quest estimate') ?? null),
		now,
		questId,
	);

	return getQuestOrThrow(db, questId);
}
