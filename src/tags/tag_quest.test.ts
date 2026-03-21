import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { replaceActiveQuestTags } from './replace_active_quest_tags.ts';
import { tagQuest } from './tag_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('tagQuest', () => {
	it('merges new tag names with existing active tags', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		replaceActiveQuestTags(db, q.id, ['a'], 2);
		tagQuest(db, q.id, ['b'], 3);
		const names = db
			.prepare(
				`SELECT t.name
         FROM quest_tags qt
         JOIN tags t ON t.id = qt.tag_id
         WHERE qt.quest_id = ? AND qt.deleted_at IS NULL
         ORDER BY t.name`,
			)
			.all(q.id) as { name: string }[];
		strictEqual(names.map((n) => n.name).join(','), 'a,b');
		const questUpdated = Number(
			db.prepare('SELECT updated_at FROM quests WHERE id = ?').get(q.id)?.updated_at ?? 0,
		);
		strictEqual(questUpdated, 3);
	});
});
