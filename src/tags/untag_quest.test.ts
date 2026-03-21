import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from '../quests/create_quest.ts';
import { replaceActiveQuestTags } from './replace_active_quest_tags.ts';
import { untagQuest } from './untag_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('untagQuest', () => {
	it('removes tags case-insensitively by the provided names', () => {
		const q = createQuest(db, { title: 'Q', objective: 'o', now: 1 });
		replaceActiveQuestTags(db, q.id, ['Alpha', 'Beta'], 2);
		untagQuest(db, q.id, ['alpha'], 3);
		const names = db
			.prepare(
				`SELECT t.name
         FROM quest_tags qt
         JOIN tags t ON t.id = qt.tag_id
         WHERE qt.quest_id = ? AND qt.deleted_at IS NULL`,
			)
			.all(q.id) as { name: string }[];
		strictEqual(names.length, 1);
		strictEqual(names[0]?.name, 'Beta');
	});
});
