import type { QuestlogDb } from '../database.ts';
import { resolveQuest } from './resolve_quest.ts';
import type { Quest } from './types.ts';

/**
 * Resolves a quest successfully.
 */
export function finishQuest(
	db: QuestlogDb,
	questId: number,
	outcome: string,
	resolvedAt?: number,
): Quest {
	return resolveQuest(db, questId, true, outcome, resolvedAt);
}
