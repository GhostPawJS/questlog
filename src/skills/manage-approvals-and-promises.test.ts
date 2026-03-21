import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	organizeWorkTool,
	planQuestTool,
	reviewQuestlogTool,
	shapeWorkTool,
} from '../tools/index.ts';
import { manageApprovalsAndPromisesSkill } from './manage-approvals-and-promises.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('manageApprovalsAndPromisesSkill', () => {
	it('models approvals as real work with unlocks and timing pressure', async () => {
		expectSkillMentionsTools(manageApprovalsAndPromisesSkill, [
			'shape_work',
			'organize_work',
			'plan_quest',
			'review_questlog',
		]);
		expectSkillAvoidsDirectApi(manageApprovalsAndPromisesSkill, [
			'createQuest',
			'addUnlock',
			'listDueSoonQuests',
		]);

		const db = await createSkillTestDb();
		const approval = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Get budget approval', objective: 'Get explicit budget approval.' },
			}),
		);
		const delivery = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Start vendor work', objective: 'Start vendor work after approval.' },
			}),
		);

		expectSuccess(
			organizeWorkTool.handler(db, {
				action: 'add_unlock',
				fromQuestId: approval.data.quest?.id ?? 0,
				toQuestId: delivery.data.quest?.id ?? 0,
			}),
		);
		expectSuccess(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId: approval.data.quest?.id ?? 0,
				dueAt: 100,
				now: 1,
			}),
		);

		const dueSoon = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.due_soon',
				now: 50,
			}),
		);
		const blocked = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.blocked',
				now: 50,
			}),
		);
		strictEqual(dueSoon.data.count, 1);
		strictEqual(blocked.data.count, 1);
	});
});
