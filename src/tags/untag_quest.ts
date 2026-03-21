import { assertActiveRowExists } from '../assert_active_row_exists';
import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { replaceActiveQuestTags } from './replace_active_quest_tags';

/**
 * Removes tags from a concrete quest.
 */
export function untagQuest(
	db: QuestlogDb,
	questId: number,
	tagNames: string[],
	now?: number,
): void {
	assertActiveRowExists(db, 'quests', questId, 'Quest');
	const removeSet = new Set(tagNames.map((tag) => tag.trim().toLowerCase()));
	const current = db
		.prepare(
			`SELECT t.name
       FROM quest_tags qt
       JOIN tags t ON t.id = qt.tag_id
       WHERE qt.quest_id = ? AND qt.deleted_at IS NULL AND t.deleted_at IS NULL`,
		)
		.all(questId)
		.map((row) => String(row.name))
		.filter((name) => !removeSet.has(name.trim().toLowerCase()));

	replaceActiveQuestTags(db, questId, current, now);
	db.prepare('UPDATE quests SET updated_at = ? WHERE id = ?').run(resolveNow(now), questId);
}
