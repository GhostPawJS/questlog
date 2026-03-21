import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { abandonQuest } from './abandon_quest.ts';
import { createQuest } from './create_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('abandonQuest', () => {
	it('terminates with success=false while still recording outcome text', () => {
		const q = createQuest(db, { title: 'Try', objective: 'Fail', now: 1 });
		const r = abandonQuest(db, q.id, 'Blocked upstream', 4);
		strictEqual(r.success, false);
		strictEqual(r.outcome, 'Blocked upstream');
	});
});
