import type { QuestlogDb } from '../database';
import { resolveQuest } from './resolve_quest';
import type { Quest } from './types';

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
