import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import type { Questline } from './types';
import { updateQuestline } from './update_questline';

/**
 * Archives a questline without deleting it.
 */
export function archiveQuestline(
	db: QuestlogDb,
	questlineId: number,
	archivedAt?: number,
): Questline {
	return updateQuestline(db, questlineId, { archivedAt: resolveNow(archivedAt) });
}
