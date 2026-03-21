import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { captureRumorTool, searchQuestlogTool, shapeWorkTool } from '../tools/index.ts';
import { clarifyAmbiguousRequestsSkill } from './clarify-ambiguous-requests.ts';
import {
	createSkillTestDb,
	expectClarification,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('clarifyAmbiguousRequestsSkill', () => {
	it('keeps ambiguity in intake until the settlement branch is explicit', async () => {
		expectSkillMentionsTools(clarifyAmbiguousRequestsSkill, [
			'capture_rumor',
			'search_questlog',
			'inspect_questlog_item',
			'shape_work',
		]);
		expectSkillAvoidsDirectApi(clarifyAmbiguousRequestsSkill, [
			'captureRumor',
			'createQuest',
			'settleRumor',
		]);

		const db = await createSkillTestDb();
		const rumor = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Security follow-up',
				details: 'Need clarity on whether this is one quest or an arc.',
				now: 1,
			}),
		);

		const clarification = expectClarification(
			shapeWorkTool.handler(db, {
				action: 'settle_rumor',
				rumorId: rumor.data.rumor.id,
			}),
		);
		strictEqual(clarification.clarification.code, 'missing_required_choice');

		const settled = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'settle_rumor',
				rumorId: rumor.data.rumor.id,
				settledAt: 2,
				quests: [
					{
						title: 'Review security feedback',
						objective: 'Turn the ambiguous ask into one executable review task.',
					},
				],
			}),
		);
		strictEqual(settled.data.action, 'settle_rumor');
		strictEqual(settled.data.quests?.length, 1);

		const exactSearch = expectSuccess(
			searchQuestlogTool.handler(db, {
				query: 'Security',
				mode: 'browse',
			}),
		);
		strictEqual(exactSearch.data.totalCount >= 2, true);
	});
});
