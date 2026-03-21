import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { organizeWorkTool, reviewQuestlogTool, shapeWorkTool } from '../tools/index.ts';
import { reportStatusAndManageExpectationsSkill } from './report-status-and-manage-expectations.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('reportStatusAndManageExpectationsSkill', () => {
	it('reports real available and blocked slices instead of flattening status', async () => {
		expectSkillMentionsTools(reportStatusAndManageExpectationsSkill, [
			'review_questlog',
			'inspect_questlog_item',
		]);
		expectSkillAvoidsDirectApi(reportStatusAndManageExpectationsSkill, [
			'listBlockedQuests',
			'listResolvedQuests',
			'getQuestDetail',
		]);

		const db = await createSkillTestDb();
		const questA = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Draft note', objective: 'Draft the stakeholder note.' },
			}),
		);
		const questB = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Approve note', objective: 'Approve the stakeholder note.' },
			}),
		);

		expectSuccess(
			organizeWorkTool.handler(db, {
				action: 'add_unlock',
				fromQuestId: questA.data.quest?.id ?? 0,
				toQuestId: questB.data.quest?.id ?? 0,
			}),
		);

		const available = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.available',
			}),
		);
		const blocked = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.blocked',
			}),
		);

		strictEqual(available.data.count, 1);
		strictEqual(blocked.data.count, 1);
	});
});
