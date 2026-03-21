import type { QuestlogDb } from '../database';
import { resolveNow } from '../resolve_now';
import { normalizeTagName } from './normalize_tag_name';

function getOrCreateTagId(db: QuestlogDb, name: string, now: number): number {
	const normalizedName = normalizeTagName(name);
	if (!normalizedName) {
		throw new Error('Tag name must not be empty.');
	}

	const existing = db
		.prepare('SELECT id FROM tags WHERE normalized_name = ? AND deleted_at IS NULL')
		.get(normalizedName);
	if (existing) {
		return Number(existing.id);
	}

	const created = db
		.prepare(
			`INSERT INTO tags (name, normalized_name, created_at)
       VALUES (?, ?, ?)`,
		)
		.run(name.trim(), normalizedName, now);

	return Number(created.lastInsertRowid);
}

/**
 * Replaces the active tags attached to a concrete quest.
 */
export function replaceActiveQuestTags(
	db: QuestlogDb,
	questId: number,
	tagNames: string[],
	now?: number,
): void {
	const effectiveNow = resolveNow(now);
	db.prepare('UPDATE quest_tags SET deleted_at = ? WHERE quest_id = ? AND deleted_at IS NULL').run(
		effectiveNow,
		questId,
	);

	const uniqueNames = [...new Set(tagNames.map((tag) => tag.trim()).filter(Boolean))];
	for (const name of uniqueNames) {
		const tagId = getOrCreateTagId(db, name, effectiveNow);
		db.prepare(
			`INSERT INTO quest_tags (quest_id, tag_id, created_at)
       VALUES (?, ?, ?)`,
		).run(questId, tagId, effectiveNow);
	}
}
