import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { addUnlock } from './add_unlock';
import { wouldCreateUnlockCycle } from './would_create_unlock_cycle';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('wouldCreateUnlockCycle', () => {
	it('detects a cycle when the proposed edge would let you walk from the target back to the source', () => {
		const a = createQuest(db, { title: 'A', objective: 'a', now: 1 });
		const b = createQuest(db, { title: 'B', objective: 'b', now: 1 });
		const c = createQuest(db, { title: 'C', objective: 'c', now: 1 });
		addUnlock(db, a.id, b.id, 2);
		addUnlock(db, b.id, c.id, 3);
		// Proposed c → a closes A → B → C → A
		strictEqual(wouldCreateUnlockCycle(db, c.id, a.id), true);
		// Proposed a → b is already an edge; even if re-added, forward walk from b does not reach a
		strictEqual(wouldCreateUnlockCycle(db, a.id, b.id), false);
	});

	it('returns false for a DAG edge that does not reach back to from', () => {
		const a = createQuest(db, { title: 'A', objective: 'a', now: 1 });
		const b = createQuest(db, { title: 'B', objective: 'b', now: 1 });
		addUnlock(db, a.id, b.id, 2);
		strictEqual(wouldCreateUnlockCycle(db, a.id, b.id), false);
	});
});
