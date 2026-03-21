import type { QuestlogDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';

/**
 * Copies active repeatable quest tag templates onto a spawned quest.
 */
export function copyRepeatableQuestTagsToQuest(
	db: QuestlogDb,
	repeatableQuestId: number,
	questId: number,
	now?: number,
): void {
	const effectiveNow = resolveNow(now);
	const rows = db
		.prepare(
			`SELECT tag_id
       FROM repeatable_quest_tags
       WHERE repeatable_quest_id = ? AND deleted_at IS NULL`,
		)
		.all(repeatableQuestId);

	for (const row of rows) {
		db.prepare(
			`INSERT INTO quest_tags (quest_id, tag_id, created_at)
       VALUES (?, ?, ?)`,
		).run(questId, Number(row.tag_id), effectiveNow);
	}
}
