import type { QuestlogDb } from '../database.ts';
import { listQuestDetails } from './list_quest_details.ts';
import type { QuestDetail, QuestListFilters } from './types.ts';

/**
 * Lists in-progress quests.
 */
export function listInProgressQuests(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return listQuestDetails(db, filters, now).filter((quest) => quest.state === 'in_progress');
}
