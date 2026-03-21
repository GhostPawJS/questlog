import { throws } from 'node:assert';
import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reviewQuestlogTool } from '../tools/review_questlog_tool.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('skill_test_utils', () => {
	it('creates initialized test databases for skill scenarios', async () => {
		const db = await createSkillTestDb();
		const review = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'rumors',
			}),
		);

		strictEqual(review.ok, true);
	});

	it('checks tool mentions and direct-api avoidance in skill content', () => {
		const cleanSkill = {
			name: 'clean',
			description: 'Clean.',
			content: 'Use `search_questlog` before `inspect_questlog_item`.',
		};
		expectSkillMentionsTools(cleanSkill, ['search_questlog', 'inspect_questlog_item']);
		expectSkillAvoidsDirectApi(cleanSkill, ['createQuest', 'searchQuestlog']);

		throws(() => expectSkillMentionsTools(cleanSkill, ['shape_work']));
		throws(() =>
			expectSkillAvoidsDirectApi(
				{
					...cleanSkill,
					content: 'Call createQuest() directly.',
				},
				['createQuest'],
			),
		);
	});
});
