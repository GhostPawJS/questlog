import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { createQuestline } from './create_questline';
import { listQuestlines } from './list_questlines';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listQuestlines', () => {
	it('returns active questlines with aggregate stats', () => {
		const older = createQuestline(db, { title: 'Old', now: 1 });
		const newer = createQuestline(db, { title: 'New', now: 5 });
		createQuest(db, { title: 'Q', objective: 'o', questlineId: newer.id, now: 6 });
		const rows = listQuestlines(db, 10);
		strictEqual(rows[0]?.id, newer.id);
		strictEqual(rows.find((r) => r.id === older.id)?.totalQuests ?? 0, 0);
		strictEqual(rows.find((r) => r.id === newer.id)?.totalQuests, 1);
	});
});
