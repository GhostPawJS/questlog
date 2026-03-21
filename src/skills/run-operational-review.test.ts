import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planQuestTool, reviewQuestlogTool, shapeWorkTool } from '../tools/index.ts';
import { runOperationalReviewSkill } from './run-operational-review.ts';
import {
	createSkillTestDb,
	expectClarification,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('runOperationalReviewSkill', () => {
	it('uses structured review views, handles missing day clarification, and ends with a planning change', async () => {
		expectSkillMentionsTools(runOperationalReviewSkill, [
			'review_questlog',
			'inspect_questlog_item',
			'plan_quest',
			'run_quest',
		]);
		expectSkillAvoidsDirectApi(runOperationalReviewSkill, [
			'listAvailableQuests',
			'listScheduledForDay',
			'startQuest',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Weekly ops review',
					objective: 'Review the operational state for the week.',
				},
			}),
		);

		const available = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.available',
			}),
		);
		strictEqual(available.data.count, 1);

		const needsDay = expectClarification(
			reviewQuestlogTool.handler(db, {
				view: 'quests.scheduled_for_day',
			}),
		);
		strictEqual(needsDay.clarification.code, 'missing_required_choice');

		const replanned = expectSuccess(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId: quest.data.quest?.id ?? 0,
				dueAt: 5000,
			}),
		);
		strictEqual(replanned.data.quest.dueAt, 5000);
	});
});
