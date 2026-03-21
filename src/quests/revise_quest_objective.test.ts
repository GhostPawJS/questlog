import { strictEqual, throws } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { createQuest } from './create_quest.ts';
import { getQuestDetail } from './get_quest_detail.ts';
import { listDeferredQuests } from './list_deferred_quests.ts';
import { listDueSoonQuests } from './list_due_soon_quests.ts';
import { listMissedScheduledQuests } from './list_missed_scheduled_quests.ts';
import { listScheduledForDay } from './list_scheduled_for_day.ts';
import { planQuestTime } from './plan_quest_time.ts';
import { reviseQuestObjective } from './revise_quest_objective.ts';
import { startQuest } from './start_quest.ts';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('reviseQuestObjective / planQuestTime / list reads / startQuest', () => {
	it('freezes objectives after actual start and supports read models', () => {
		const quest = createQuest(db, {
			title: 'Attend conference',
			objective: 'Attend the conference session',
			scheduledStartAt: 1000,
			scheduledEndAt: 2000,
			now: 10,
		});

		const revised = reviseQuestObjective(db, quest.id, 'Attend the keynote session', 20);
		strictEqual(revised.objective, 'Attend the keynote session');

		const planned = planQuestTime(db, quest.id, {
			notBeforeAt: 900,
			dueAt: 2500,
			estimateSeconds: 1800,
			now: 30,
		});
		strictEqual(planned.notBeforeAt, 900);
		strictEqual(planned.estimateSeconds, 1800);

		const detail = getQuestDetail(db, quest.id, 100);
		strictEqual(detail.state, 'open');
		strictEqual(detail.available, false);

		strictEqual(listDeferredQuests(db, {}, 100).length, 1);
		strictEqual(listDueSoonQuests(db, 3000, {}, 100).length, 1);
		strictEqual(listScheduledForDay(db, 0, 3000).length, 1);
		strictEqual(listMissedScheduledQuests(db, {}, 3000).length, 1);

		startQuest(db, quest.id, 1000);
		throws(
			() => reviseQuestObjective(db, quest.id, 'Too late'),
			/cannot change after the quest has actually started/,
		);
	});
});
