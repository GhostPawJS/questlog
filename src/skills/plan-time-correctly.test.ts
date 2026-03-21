import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planQuestTool, reviewQuestlogTool, shapeWorkTool } from '../tools/index.ts';
import { planTimeCorrectlySkill } from './plan-time-correctly.ts';
import {
	createSkillTestDb,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('planTimeCorrectlySkill', () => {
	it('changes timing deliberately and accepts no-op when the plan is already correct', async () => {
		expectSkillMentionsTools(planTimeCorrectlySkill, [
			'plan_quest',
			'review_questlog',
			'inspect_questlog_item',
		]);
		expectSkillAvoidsDirectApi(planTimeCorrectlySkill, [
			'planQuestTime',
			'listDeferredQuests',
			'listOverdueQuests',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Plan timeline',
					objective: 'Set the timeline fields correctly.',
				},
			}),
		);
		const questId = quest.data.quest?.id ?? 0;

		const planned = expectSuccess(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId,
				notBeforeAt: 1000,
				dueAt: 2000,
				now: 1,
			}),
		);
		strictEqual(planned.data.quest.notBeforeAt, 1000);

		const unchanged = expectNoOp(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId,
				notBeforeAt: 1000,
				dueAt: 2000,
				now: 2,
			}),
		);
		strictEqual(unchanged.data.action, 'set_time');

		const deferred = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.deferred',
				now: 500,
			}),
		);
		strictEqual(deferred.data.count, 1);
	});
});
