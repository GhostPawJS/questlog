import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planQuestTool, reviewQuestlogTool, shapeWorkTool } from '../tools/index.ts';
import { detectSlipsAndStalenessSkill } from './detect-slips-and-staleness.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('detectSlipsAndStalenessSkill', () => {
	it('finds overdue work and repairs timing drift with planning changes', async () => {
		expectSkillMentionsTools(detectSlipsAndStalenessSkill, [
			'review_questlog',
			'inspect_questlog_item',
			'plan_quest',
			'run_quest',
		]);
		expectSkillAvoidsDirectApi(detectSlipsAndStalenessSkill, [
			'listOverdueQuests',
			'getQuestDetail',
			'planQuestTime',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Repair timeline',
					objective: 'Fix the project timeline.',
					dueAt: 100,
					now: 1,
				},
			}),
		);

		const overdue = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.overdue',
				now: 200,
			}),
		);
		strictEqual(overdue.data.count, 1);

		const replanned = expectSuccess(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId: quest.data.quest?.id ?? 0,
				dueAt: 1000,
				now: 200,
			}),
		);
		strictEqual(replanned.data.quest.dueAt, 1000);
	});
});
