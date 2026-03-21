import { deepStrictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { replaceQuestTags } from './replace_quest_tags.ts';
import { tagQuest } from './tag_quest.ts';
import { untagQuest } from './untag_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('replaceQuestTags / tagQuest / untagQuest', () => {
	it('normalizes, replaces, adds, and removes quest tags', () => {
		const quest = createQuest(db, { title: 'Quest', objective: 'Do it', now: 10 });
		replaceQuestTags(db, quest.id, ['Work', ' urgent '], 20);

		let names = db
			.prepare(
				`SELECT t.name
         FROM quest_tags qt
         JOIN tags t ON t.id = qt.tag_id
         WHERE qt.quest_id = ? AND qt.deleted_at IS NULL AND t.deleted_at IS NULL
         ORDER BY t.name`,
			)
			.all(quest.id)
			.map((row) => String(row.name));
		deepStrictEqual(names, ['Work', 'urgent']);

		tagQuest(db, quest.id, ['Deep Work'], 30);
		untagQuest(db, quest.id, ['work'], 40);

		names = db
			.prepare(
				`SELECT t.name
         FROM quest_tags qt
         JOIN tags t ON t.id = qt.tag_id
         WHERE qt.quest_id = ? AND qt.deleted_at IS NULL AND t.deleted_at IS NULL
         ORDER BY t.name`,
			)
			.all(quest.id)
			.map((row) => String(row.name));
		deepStrictEqual(names, ['Deep Work', 'urgent']);
	});
});
