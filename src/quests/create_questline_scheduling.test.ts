import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database';
import { createInitializedQuestlogDb } from '../lib/test-db';
import { createQuestline } from '../questlines/create_questline';
import { createQuest } from './create_quest';
import { getQuestDetail } from './get_quest_detail';
import { listActiveQuests } from './list_active_quests';
import { listScheduledForDay } from './list_scheduled_for_day';
import { listScheduledNow } from './list_scheduled_now';

let db: QuestlogDb;

beforeEach(async () => {
	db = await createInitializedQuestlogDb();
});

describe('scheduled quests + questline due inheritance', () => {
	it('keeps scheduled quests open until explicitly started and inherits questline due dates', () => {
		const questline = createQuestline(db, {
			title: 'Trip',
			dueAt: 9_000,
			now: 10,
		});
		const quest = createQuest(db, {
			questlineId: questline.id,
			title: 'Travel day',
			objective: 'Reach the destination city',
			scheduledStartAt: 1_000,
			scheduledEndAt: 2_000,
			allDay: true,
			now: 20,
		});

		const detail = getQuestDetail(db, quest.id, 1_500);
		strictEqual(detail.state, 'open');
		strictEqual(detail.startedAt, null);
		strictEqual(detail.allDay, true);
		strictEqual(detail.effectiveDueAt, 9_000);
		strictEqual(
			listScheduledNow(db, {}, 1_500).some((scheduledQuest) => scheduledQuest.id === quest.id),
			true,
		);
		strictEqual(
			listScheduledForDay(db, 0, 86_400_000, {}, 1_500).some(
				(scheduledQuest) => scheduledQuest.id === quest.id,
			),
			true,
		);
		strictEqual(
			listActiveQuests(db, {}, 1_500).some((activeQuest) => activeQuest.id === quest.id),
			true,
		);
	});
});
