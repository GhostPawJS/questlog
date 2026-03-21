import type { QuestlogDb } from '../database';
import { listQuestDetails } from './list_quest_details';
import type { QuestDetail, QuestListFilters } from './types';

/**
 * Lists unresolved quests whose scheduled window has already been missed.
 */
export function listMissedScheduledQuests(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return listQuestDetails(db, filters, now).filter(
		(quest) =>
			quest.resolvedAt == null && quest.scheduledEndAt != null && quest.scheduledEndAt < now,
	);
}
