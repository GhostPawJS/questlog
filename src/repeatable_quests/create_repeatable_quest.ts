import { assertActiveRowExists } from '../assert_active_row_exists';
import { assertNonEmpty } from '../assert_non_empty';
import { assertNonNegativeSeconds } from '../assert_non_negative_seconds';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { replaceActiveRepeatableQuestRewards } from '../rewards/replace_active_repeatable_quest_rewards';
import { replaceActiveRepeatableQuestTags } from '../tags/replace_active_repeatable_quest_tags';
import { withTransaction } from '../with_transaction';
import { getRepeatableQuestOrThrow } from './get_repeatable_quest_or_throw';
import { parseRRule } from './parse_rrule';
import type { CreateRepeatableQuestInput, RepeatableQuest } from './types';

/**
 * Creates a repeatable quest definition.
 */
export function createRepeatableQuest(
	db: QuestlogDb,
	input: CreateRepeatableQuestInput,
): RepeatableQuest {
	return withTransaction(db, () => {
		const now = resolveNow(input.now);
		const title = assertNonEmpty(input.title, 'Repeatable quest title');
		const objective = assertNonEmpty(input.objective, 'Repeatable quest objective');
		parseRRule(input.rrule);

		if (input.questlineId != null) {
			assertActiveRowExists(db, 'questlines', input.questlineId, 'Questline');
		}

		const created = db
			.prepare(
				`INSERT INTO repeatable_quests (
           questline_id,
           title,
           objective,
           rrule,
           anchor_at,
           not_before_offset_seconds,
           due_offset_seconds,
           scheduled_start_offset_seconds,
           scheduled_end_offset_seconds,
           all_day,
           estimate_seconds,
           created_at,
           updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.run(
				input.questlineId ?? null,
				title,
				objective,
				input.rrule,
				input.anchorAt,
				assertNonNegativeSeconds(input.notBeforeOffsetSeconds, 'Repeatable not-before offset') ??
					null,
				assertNonNegativeSeconds(input.dueOffsetSeconds, 'Repeatable due offset') ?? null,
				input.scheduledStartOffsetSeconds ?? null,
				input.scheduledEndOffsetSeconds ?? null,
				input.allDay ? 1 : 0,
				assertNonNegativeSeconds(input.estimateSeconds, 'Repeatable estimate') ?? null,
				now,
				now,
			);

		const repeatableQuestId = Number(created.lastInsertRowid);

		if (input.tags && input.tags.length > 0) {
			replaceActiveRepeatableQuestTags(db, repeatableQuestId, input.tags, now);
		}
		if (input.rewards && input.rewards.length > 0) {
			replaceActiveRepeatableQuestRewards(db, repeatableQuestId, input.rewards, now);
		}

		return getRepeatableQuestOrThrow(db, repeatableQuestId);
	});
}
