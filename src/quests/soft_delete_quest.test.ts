import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuest } from './create_quest';
import { listActiveQuests } from './list_active_quests';
import { listOpenQuests } from './list_open_quests';
import { softDeleteQuest } from './soft_delete_quest';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('softDeleteQuest', () => {
	it('excludes soft-deleted quests from default active and open reads', () => {
		const quest = createQuest(db, {
			title: 'Old note',
			objective: 'Do the old note',
			now: 10,
		});

		softDeleteQuest(db, quest.id, 20);

		strictEqual(
			listOpenQuests(db).some((openQuest) => openQuest.id === quest.id),
			false,
		);
		strictEqual(
			listActiveQuests(db).some((activeQuest) => activeQuest.id === quest.id),
			false,
		);
	});
});
