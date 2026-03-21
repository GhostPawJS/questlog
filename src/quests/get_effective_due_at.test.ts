import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuestline } from '../questlines/create_questline.ts';
import { createQuest } from './create_quest.ts';
import { getEffectiveDueAt } from './get_effective_due_at.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('getEffectiveDueAt', () => {
	it('prefers the quest own due when set', () => {
		const ql = createQuestline(db, { title: 'L', dueAt: 999, now: 1 });
		const q = createQuest(db, {
			title: 'Q',
			objective: 'O',
			questlineId: ql.id,
			dueAt: 50,
			now: 2,
		});
		strictEqual(getEffectiveDueAt(db, q), 50);
	});

	it('inherits questline due when the quest has none', () => {
		const ql = createQuestline(db, { title: 'L', dueAt: 777, now: 1 });
		const q = createQuest(db, {
			title: 'Q',
			objective: 'O',
			questlineId: ql.id,
			now: 2,
		});
		strictEqual(getEffectiveDueAt(db, q), 777);
	});

	it('returns null when neither quest nor questline supplies a due', () => {
		const q = createQuest(db, { title: 'Q', objective: 'O', now: 1 });
		strictEqual(getEffectiveDueAt(db, q), null);
	});
});
