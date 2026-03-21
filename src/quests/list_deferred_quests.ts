import type { QuestlogDb } from '../database.ts';
import { listQuestDetails } from './list_quest_details.ts';
import type { QuestDetail, QuestListFilters } from './types.ts';

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
