import type { QuestlogDb } from '../database';
import { resolveQuest } from './resolve_quest';
import type { Quest } from './types';

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
