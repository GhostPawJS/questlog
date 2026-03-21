import type { QuestlogDb } from '../database';
import { queryQuestDetailRecords } from './query_quest_detail_records';
import type { QuestDetail } from './types';

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
