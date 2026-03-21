import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { addUnlock } from './add_unlock';
import { removeUnlock } from './remove_unlock';
import { replaceUnlocks } from './replace_unlocks';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('replaceUnlocks / removeUnlock', () => {
	it('rejects cyclic dependencies and can replace active prerequisites', () => {
		const questA = createQuest(db, { title: 'A', objective: 'Do A', now: 10 });
		const questB = createQuest(db, { title: 'B', objective: 'Do B', now: 10 });
		const questC = createQuest(db, { title: 'C', objective: 'Do C', now: 10 });

		addUnlock(db, questA.id, questB.id, 20);
		throws(() => addUnlock(db, questB.id, questA.id, 30), /cycle/);

		replaceUnlocks(db, questC.id, [questA.id, questB.id], 40);
		const rows = db
			.prepare(
				'SELECT COUNT(*) AS total FROM quest_unlocks WHERE to_quest_id = ? AND deleted_at IS NULL',
			)
			.get(questC.id);
		strictEqual(Number(rows?.total ?? 0), 2);

		removeUnlock(db, questA.id, questC.id, 50);
		const remaining = db
			.prepare(
				'SELECT COUNT(*) AS total FROM quest_unlocks WHERE to_quest_id = ? AND deleted_at IS NULL',
			)
			.get(questC.id);
		strictEqual(Number(remaining?.total ?? 0), 1);
	});
});
