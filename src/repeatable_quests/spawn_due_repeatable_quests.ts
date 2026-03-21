import type { QuestlogDb } from '../database';
import { getQuestOrThrow } from '../quests/get_quest_or_throw';
import type { Quest } from '../quests/types';
import { copyRepeatableQuestRewardsToQuest } from '../rewards/copy_repeatable_quest_rewards_to_quest';
import { copyRepeatableQuestTagsToQuest } from '../tags/copy_repeatable_quest_tags_to_quest';
import { withTransaction } from '../with_transaction';
import { getRepeatableQuestOrThrow } from './get_repeatable_quest_or_throw';
import { listDueRepeatableQuestAnchors } from './list_due_repeatable_quest_anchors';

/**
 * Materializes all due repeatable quest anchors into concrete quests.
 */
export function spawnDueRepeatableQuests(db: QuestlogDb, now: number): Quest[] {
	return withTransaction(db, () => {
		const anchors = listDueRepeatableQuestAnchors(db, now);
		const quests: Quest[] = [];

		for (const anchor of anchors) {
			const repeatable = getRepeatableQuestOrThrow(db, anchor.repeatableQuestId);
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
           ) VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
				)
				.run(
					repeatable.questlineId ?? null,
					repeatable.id,
					anchor.anchorAt,
					repeatable.title,
					repeatable.objective,
					now,
					now,
					repeatable.estimateSeconds ?? null,
					repeatable.notBeforeOffsetSeconds == null
						? null
						: anchor.anchorAt + repeatable.notBeforeOffsetSeconds * 1000,
					repeatable.dueOffsetSeconds == null
						? null
						: anchor.anchorAt + repeatable.dueOffsetSeconds * 1000,
					repeatable.scheduledStartOffsetSeconds == null
						? null
						: anchor.anchorAt + repeatable.scheduledStartOffsetSeconds * 1000,
					repeatable.scheduledEndOffsetSeconds == null
						? null
						: anchor.anchorAt + repeatable.scheduledEndOffsetSeconds * 1000,
					repeatable.allDay ? 1 : 0,
				);

			const questId = Number(created.lastInsertRowid);
			copyRepeatableQuestTagsToQuest(db, repeatable.id, questId, now);
			copyRepeatableQuestRewardsToQuest(db, repeatable.id, questId, now);
			quests.push(getQuestOrThrow(db, questId));
		}

		return quests;
	});
}
