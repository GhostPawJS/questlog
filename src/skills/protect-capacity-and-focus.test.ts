import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planQuestTool, reviewQuestlogTool, runQuestTool, shapeWorkTool } from '../tools/index.ts';
import { protectCapacityAndFocusSkill } from './protect-capacity-and-focus.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('protectCapacityAndFocusSkill', () => {
	it('uses review to see current load and planning to rebalance it', async () => {
		expectSkillMentionsTools(protectCapacityAndFocusSkill, [
			'review_questlog',
			'plan_quest',
			'run_quest',
		]);
		expectSkillAvoidsDirectApi(protectCapacityAndFocusSkill, [
			'listInProgressQuests',
			'listScheduledNow',
			'startQuest',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Focus block',
					objective: 'Work on the highest-priority item.',
					scheduledStartAt: 100,
					scheduledEndAt: 200,
					now: 1,
				},
			}),
		);

		expectSuccess(
			runQuestTool.handler(db, {
				action: 'start',
				questId: quest.data.quest?.id ?? 0,
				startedAt: 110,
			}),
		);

		const inProgress = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.in_progress',
				now: 150,
			}),
		);
		strictEqual(inProgress.data.count, 1);

		const rebalanced = expectSuccess(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId: quest.data.quest?.id ?? 0,
				notBeforeAt: 300,
				now: 150,
			}),
		);
		strictEqual(rebalanced.data.quest.notBeforeAt, 300);
	});
});
