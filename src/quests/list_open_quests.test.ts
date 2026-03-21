import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { listOpenQuests } from './list_open_quests';
import { startQuest } from './start_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('listOpenQuests', () => {
	it('includes only quests in the open state (not started, not resolved)', () => {
		const open = createQuest(db, { title: 'O', objective: 'o', now: 1 });
		const started = createQuest(db, { title: 'S', objective: 's', now: 1 });
		startQuest(db, started.id, 5);
		const rows = listOpenQuests(db, {}, 10);
		strictEqual(
			rows.some((q) => q.id === open.id),
			true,
		);
		strictEqual(
			rows.some((q) => q.id === started.id),
			false,
		);
	});
});
