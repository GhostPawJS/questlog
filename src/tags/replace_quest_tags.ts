import { assertActiveRowExists } from '../assert_active_row_exists';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { replaceActiveQuestTags } from './replace_active_quest_tags';

/**
 * Replaces the active tags on a concrete quest.
 */
export function replaceQuestTags(
	db: QuestlogDb,
	questId: number,
	tagNames: string[],
	now?: number,
): void {
	assertActiveRowExists(db, 'quests', questId, 'Quest');
	replaceActiveQuestTags(db, questId, tagNames, now);
	db.prepare('UPDATE quests SET updated_at = ? WHERE id = ?').run(resolveNow(now), questId);
}
