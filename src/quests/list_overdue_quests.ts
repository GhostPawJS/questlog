import type { QuestlogDb } from '../database';
import { listQuestDetails } from './list_quest_details';
import type { QuestDetail, QuestListFilters } from './types';

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
