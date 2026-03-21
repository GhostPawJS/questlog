import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { replaceActiveQuestTags } from './replace_active_quest_tags.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('replaceActiveQuestTags', () => {
	it('dedupes, soft-deletes old links, and creates tags as needed', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		replaceActiveQuestTags(db, q.id, ['a', 'a', 'b'], 2);
		const names = db
			.prepare(
				`SELECT t.normalized_name
         FROM quest_tags qt
         JOIN tags t ON t.id = qt.tag_id
         WHERE qt.quest_id = ? AND qt.deleted_at IS NULL
         ORDER BY t.normalized_name`,
			)
			.all(q.id) as { normalized_name: string }[];
		strictEqual(names.length, 2);
		strictEqual(names[0]?.normalized_name, 'a');
	});

	it('drops whitespace-only tag names before inserting', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		replaceActiveQuestTags(db, q.id, ['   '], 2);
		const count = Number(
			db
				.prepare('SELECT COUNT(*) AS c FROM quest_tags WHERE quest_id = ? AND deleted_at IS NULL')
				.get(q.id)?.c ?? 0,
		);
		strictEqual(count, 0);
	});
});
