import type { QuestlogDb } from '../database.ts';
import { queryQuestDetailRecords } from './query_quest_detail_records.ts';
import type { QuestDetail, QuestListFilters } from './types.ts';

/**
 * Lists quest details matching shared quest filters.
 */
export function listQuestDetails(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return queryQuestDetailRecords(db, filters, now).map((record) => record.detail);
}
