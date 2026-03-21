import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { finishQuest } from './finish_quest';
import { resolveQuest } from './resolve_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('resolveQuest', () => {
	it('is idempotent in spirit only once: double resolution is rejected', () => {
		const q = createQuest(db, { title: 'T', objective: 'O', now: 1 });
		finishQuest(db, q.id, 'Done', 2);
		throws(
			() => resolveQuest(db, q.id, true, 'Again', 3),
			/Resolved quests cannot be resolved again/,
		);
	});

	it('rejects empty outcome text (assertNonEmpty)', () => {
		const q = createQuest(db, { title: 'T', objective: 'O', now: 1 });
		throws(() => resolveQuest(db, q.id, true, '   '), /Quest outcome must not be empty/);
	});

	it('writes success bit and outcome for terminal state', () => {
		const q = createQuest(db, { title: 'T', objective: 'O', now: 1 });
		const r = resolveQuest(db, q.id, false, 'Gave up', 5);
		strictEqual(r.success, false);
		strictEqual(r.outcome, 'Gave up');
		strictEqual(r.resolvedAt, 5);
	});
});
