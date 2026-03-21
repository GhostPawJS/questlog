import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import type { Questline } from './types.ts';
import { updateQuestline } from './update_questline.ts';

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
