import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { abandonQuest } from './abandon_quest.ts';
import { createQuest } from './create_quest.ts';
import { finishQuest } from './finish_quest.ts';
import { logQuestEffort } from './log_quest_effort.ts';
import { startQuest } from './start_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('logQuestEffort / finishQuest / abandonQuest', () => {
	it('logs effort and resolves quests', () => {
		const quest = createQuest(db, {
			title: 'Workout',
			objective: 'Do the strength session',
			now: 10,
		});
		startQuest(db, quest.id, 20);
		const withEffort = logQuestEffort(db, quest.id, 900, 30);
		strictEqual(withEffort.effortSeconds, 900);

		const done = finishQuest(db, quest.id, 'Completed the full session.', 40);
		strictEqual(done.success, true);
		strictEqual(done.outcome, 'Completed the full session.');

		const abandoned = createQuest(db, {
			title: 'Blocked task',
			objective: 'Ship blocked work',
			now: 50,
		});
		const result = abandonQuest(db, abandoned.id, 'Dependency did not arrive.', 60);
		strictEqual(result.success, false);
		strictEqual(result.outcome, 'Dependency did not arrive.');
	});
});
