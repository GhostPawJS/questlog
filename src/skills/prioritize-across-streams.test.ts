import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	organizeWorkTool,
	planQuestTool,
	reviewQuestlogTool,
	shapeWorkTool,
} from '../tools/index.ts';
import { prioritizeAcrossStreamsSkill } from './prioritize-across-streams.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('prioritizeAcrossStreamsSkill', () => {
	it('prioritizes from available work and does not confuse blocked work for executable work', async () => {
		expectSkillMentionsTools(prioritizeAcrossStreamsSkill, [
			'review_questlog',
			'inspect_questlog_item',
			'plan_quest',
		]);
		expectSkillAvoidsDirectApi(prioritizeAcrossStreamsSkill, [
			'listAvailableQuests',
			'listBlockedQuests',
			'planQuestTime',
		]);

		const db = await createSkillTestDb();
		const questA = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Write memo', objective: 'Write the memo.' },
			}),
		);
		const questB = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: { title: 'Approve memo', objective: 'Approve the memo.' },
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

		const prioritized = expectSuccess(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId: questA.data.quest?.id ?? 0,
				dueAt: 500,
			}),
		);
		strictEqual(prioritized.data.quest.dueAt, 500);
	});
});
