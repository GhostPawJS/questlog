import type { QuestlogDb } from '../database.ts';
import { queryQuestDetailRecords } from './query_quest_detail_records.ts';
import type { QuestDetail } from './types.ts';

/**
 * Loads a quest with derived state, rewards, tags, and dependency context.
 */
export function getQuestDetail(db: QuestlogDb, questId: number, now = Date.now()): QuestDetail {
	const [record] = queryQuestDetailRecords(db, {}, now, [questId]);
	if (!record) {
		throw new Error(`Quest ${questId} was not found.`);
	}
	return record.detail;
}
