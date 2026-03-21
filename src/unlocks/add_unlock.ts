import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { wouldCreateUnlockCycle } from './would_create_unlock_cycle.ts';

/**
 * Adds a hard prerequisite relation between two quests.
 */
export function addUnlock(
	db: QuestlogDb,
	fromQuestId: number,
	toQuestId: number,
	now?: number,
): void {
	assertActiveRowExists(db, 'quests', fromQuestId, 'Quest');
	assertActiveRowExists(db, 'quests', toQuestId, 'Quest');

	if (fromQuestId === toQuestId) {
		throw new Error('A quest cannot unlock itself.');
	}
	if (wouldCreateUnlockCycle(db, fromQuestId, toQuestId)) {
		throw new Error('Unlock would create a cycle.');
	}

	db.prepare(
		`INSERT INTO quest_unlocks (from_quest_id, to_quest_id, created_at)
     VALUES (?, ?, ?)`,
	).run(fromQuestId, toQuestId, resolveNow(now));
}
