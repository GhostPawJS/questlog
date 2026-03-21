import type { QuestlogDb } from '../database';
import { listQuestDetails } from './list_quest_details';
import type { QuestDetail, QuestListFilters } from './types';

/**
 * Lists quests deferred until a future moment.
 */
export function listDeferredQuests(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return listQuestDetails(db, filters, now).filter(
		(quest) => quest.resolvedAt == null && quest.notBeforeAt != null && quest.notBeforeAt > now,
	);
}
