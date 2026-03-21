import type { QuestlogDb } from '../database.ts';
import { listQuestDetails } from './list_quest_details.ts';
import type { QuestDetail, QuestListFilters } from './types.ts';

/**
 * Lists quests that are overdue by their effective due date.
 */
export function listOverdueQuests(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return listQuestDetails(db, filters, now).filter(
		(quest) =>
			quest.resolvedAt == null && quest.effectiveDueAt != null && quest.effectiveDueAt < now,
	);
}
