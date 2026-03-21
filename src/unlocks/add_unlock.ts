import { assertActiveRowExists } from '../assert_active_row_exists';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { wouldCreateUnlockCycle } from './would_create_unlock_cycle';

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
