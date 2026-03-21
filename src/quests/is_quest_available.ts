import type { QuestlogDb } from '../database';
import type { Quest } from './types';

/**
 * Determines whether a quest is currently actionable.
 */
export function isQuestAvailable(db: QuestlogDb, quest: Quest, now: number): boolean {
	if (quest.deletedAt != null || quest.resolvedAt != null) {
		return false;
	}
	if (quest.notBeforeAt != null && quest.notBeforeAt > now) {
		return false;
	}

	const blockers = db
		.prepare(
			`SELECT COUNT(*) AS total
       FROM quest_unlocks qu
       JOIN quests q ON q.id = qu.from_quest_id
       WHERE qu.to_quest_id = ?
         AND qu.deleted_at IS NULL
         AND q.deleted_at IS NULL
         AND NOT (q.resolved_at IS NOT NULL AND q.success = 1)`,
		)
		.get(quest.id);

	return Number(blockers?.total ?? 0) === 0;
}
