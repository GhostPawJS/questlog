import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { replaceActiveRepeatableQuestTags } from './replace_active_repeatable_quest_tags.ts';

/**
 * Replaces the active tag templates on a repeatable quest definition.
 */
export function replaceRepeatableQuestTags(
	db: QuestlogDb,
	repeatableQuestId: number,
	tagNames: string[],
	now?: number,
): void {
	assertActiveRowExists(db, 'repeatable_quests', repeatableQuestId, 'Repeatable quest');
	replaceActiveRepeatableQuestTags(db, repeatableQuestId, tagNames, now);
	db.prepare('UPDATE repeatable_quests SET updated_at = ? WHERE id = ?').run(
		resolveNow(now),
		repeatableQuestId,
	);
}
