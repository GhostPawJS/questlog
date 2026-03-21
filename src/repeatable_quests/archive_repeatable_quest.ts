import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import type { RepeatableQuest } from './types.ts';
import { updateRepeatableQuest } from './update_repeatable_quest.ts';

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
