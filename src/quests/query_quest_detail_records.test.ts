import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { queryQuestDetailRecords } from './query_quest_detail_records';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('queryQuestDetailRecords', () => {
	it('returns blockerCount alongside detail for dependency-aware UIs', () => {
		const a = createQuest(db, { title: 'A', objective: 'a', now: 1 });
		const b = createQuest(db, { title: 'B', objective: 'b', now: 1 });
		db.prepare(
			`INSERT INTO quest_unlocks (from_quest_id, to_quest_id, created_at)
       VALUES (?, ?, 1)`,
		).run(a.id, b.id);
		const records = queryQuestDetailRecords(db, {}, 10, [b.id]);
		strictEqual(records.length, 1);
		strictEqual(records[0]?.blockerCount >= 1, true);
		strictEqual(records[0]?.detail.id, b.id);
	});

	it('returns empty when questIds filter is an empty array (explicit no-op)', () => {
		createQuest(db, { title: 'X', objective: 'y', now: 1 });
		strictEqual(queryQuestDetailRecords(db, {}, 10, []).length, 0);
	});
});
