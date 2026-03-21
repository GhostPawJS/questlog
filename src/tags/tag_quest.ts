import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { replaceActiveQuestTags } from './replace_active_quest_tags.ts';

/**
 * Adds tags to a concrete quest without disturbing existing active tags.
 */
export function tagQuest(db: QuestlogDb, questId: number, tagNames: string[], now?: number): void {
	assertActiveRowExists(db, 'quests', questId, 'Quest');
	const current = db
		.prepare(
			`SELECT t.name
       FROM quest_tags qt
       JOIN tags t ON t.id = qt.tag_id
       WHERE qt.quest_id = ? AND qt.deleted_at IS NULL AND t.deleted_at IS NULL`,
		)
		.all(questId)
		.map((row) => String(row.name));

	replaceActiveQuestTags(db, questId, [...current, ...tagNames], now);
	db.prepare('UPDATE quests SET updated_at = ? WHERE id = ?').run(resolveNow(now), questId);
}
