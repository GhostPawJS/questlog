import type { QuestlogDb } from '../database';
import { listQuestDetails } from './list_quest_details';
import type { QuestDetail, QuestListFilters } from './types';

/**
 * Lists all non-terminal quests, whether open or already in progress.
 */
export function listActiveQuests(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return listQuestDetails(db, filters, now).filter(
		(quest) => quest.state === 'open' || quest.state === 'in_progress',
	);
}
