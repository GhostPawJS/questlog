import type { QuestlogDb } from '../database.ts';
import { queryQuestDetailRecords } from './query_quest_detail_records.ts';
import type { QuestDetail, QuestListFilters } from './types.ts';

/**
 * Lists unresolved quests that are blocked by unmet unlock prerequisites.
 */
export function listBlockedQuests(
	db: QuestlogDb,
	filters: QuestListFilters = {},
	now = Date.now(),
): QuestDetail[] {
	return queryQuestDetailRecords(db, filters, now)
		.filter(
			(record) =>
				(record.detail.state === 'open' || record.detail.state === 'in_progress') &&
				record.blockerCount > 0,
		)
		.map((record) => record.detail);
}
