import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from '../quests/create_quest';
import { finishQuest } from '../quests/finish_quest';
import { listAvailableQuests } from '../quests/list_available_quests';
import { listBlockedQuests } from '../quests/list_blocked_quests';
import { addUnlock } from './add_unlock';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('addUnlock', () => {
	it('makes target quests unavailable until prerequisites succeed', () => {
		const questA = createQuest(db, { title: 'A', objective: 'Do A', now: 10 });
		const questB = createQuest(db, { title: 'B', objective: 'Do B', now: 10 });

		addUnlock(db, questA.id, questB.id, 20);
		strictEqual(
			listAvailableQuests(db).some((quest) => quest.id === questB.id),
			false,
		);
		strictEqual(
			listBlockedQuests(db).some((quest) => quest.id === questB.id),
			true,
		);

		finishQuest(db, questA.id, 'Done', 30);

		strictEqual(
			listAvailableQuests(db).some((quest) => quest.id === questB.id),
			true,
		);
		strictEqual(
			listBlockedQuests(db).some((quest) => quest.id === questB.id),
			false,
		);
	});
});
