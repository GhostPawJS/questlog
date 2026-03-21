import { assertActiveRowExists } from '../assert_active_row_exists';
import { assertNonEmpty } from '../assert_non_empty';
import { assertNonNegativeSeconds } from '../assert_non_negative_seconds';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { replaceActiveQuestRewards } from '../rewards/replace_active_quest_rewards';
import { replaceActiveQuestTags } from '../tags/replace_active_quest_tags';
import { withTransaction } from '../with_transaction';
import { getQuestOrThrow } from './get_quest_or_throw';
import type { CreateQuestInput, Quest } from './types';

/**
 * Creates a concrete quest commitment.
 */
export function createQuest(db: QuestlogDb, input: CreateQuestInput): Quest {
	return withTransaction(db, () => {
		const now = resolveNow(input.now);
		const title = assertNonEmpty(input.title, 'Quest title');
		const objective = assertNonEmpty(input.objective, 'Quest objective');

		if (input.questlineId != null) {
			assertActiveRowExists(db, 'questlines', input.questlineId, 'Questline');
		}
		if (input.sourceRumorId != null) {
			assertActiveRowExists(db, 'rumors', input.sourceRumorId, 'Rumor');
		}
		if (input.spawnedByQuestId != null) {
			assertActiveRowExists(db, 'quests', input.spawnedByQuestId, 'Quest');
		}
		if (input.spawnedFromRepeatableId != null) {
			assertActiveRowExists(
				db,
				'repeatable_quests',
				input.spawnedFromRepeatableId,
				'Repeatable quest',
			);
		}

		assertNonNegativeSeconds(input.estimateSeconds, 'Quest estimate');

		const created = db
			.prepare(
				`INSERT INTO quests (
           questline_id,
           source_rumor_id,
           spawned_by_quest_id,
           spawned_from_repeatable_id,
           spawned_for_at,
           title,
           objective,
           created_at,
           updated_at,
           effort_seconds,
           estimate_seconds,
           not_before_at,
           due_at,
           scheduled_start_at,
           scheduled_end_at,
           all_day
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
			)
			.run(
				input.questlineId ?? null,
				input.sourceRumorId ?? null,
				input.spawnedByQuestId ?? null,
				input.spawnedFromRepeatableId ?? null,
				input.spawnedForAt ?? null,
				title,
				objective,
				now,
				now,
				input.estimateSeconds ?? null,
				input.notBeforeAt ?? null,
				input.dueAt ?? null,
				input.scheduledStartAt ?? null,
				input.scheduledEndAt ?? null,
				input.allDay ? 1 : 0,
			);

		const questId = Number(created.lastInsertRowid);

		if (input.tags && input.tags.length > 0) {
			replaceActiveQuestTags(db, questId, input.tags, now);
		}
		if (input.rewards && input.rewards.length > 0) {
			replaceActiveQuestRewards(db, questId, input.rewards, now);
		}

		return getQuestOrThrow(db, questId);
	});
}
