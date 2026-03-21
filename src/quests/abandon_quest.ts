import type { QuestlogDb } from '../database.ts';
import { resolveQuest } from './resolve_quest.ts';
import type { Quest } from './types.ts';

/**
 * Abandons a quest with terminal outcome text.
 */
export function abandonQuest(
	db: QuestlogDb,
	questId: number,
	outcome: string,
	resolvedAt?: number,
): Quest {
	return resolveQuest(db, questId, false, outcome, resolvedAt);
}
