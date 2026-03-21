import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import type { RepeatableQuest } from './types';
import { updateRepeatableQuest } from './update_repeatable_quest';

/**
 * Archives a repeatable quest definition.
 */
export function archiveRepeatableQuest(
	db: QuestlogDb,
	repeatableQuestId: number,
	archivedAt?: number,
): RepeatableQuest {
	return updateRepeatableQuest(db, repeatableQuestId, { archivedAt: resolveNow(archivedAt) });
}
