import type { QuestlogDb } from '../database';
import { queryQuestDetailRecords } from './query_quest_detail_records';
import type { QuestDetail, QuestListFilters } from './types';

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
