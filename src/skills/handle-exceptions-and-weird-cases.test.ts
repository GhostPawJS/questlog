import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { captureRumorTool, inspectQuestlogItemTool, searchQuestlogTool } from '../tools/index.ts';
import { handleExceptionsAndWeirdCasesSkill } from './handle-exceptions-and-weird-cases.ts';
import {
	createSkillTestDb,
	expectClarification,
	expectError,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
} from './skill_test_utils.ts';

describe('handleExceptionsAndWeirdCasesSkill', () => {
	it('diagnoses weird cases through structured error and clarification outcomes before acting', async () => {
		expectSkillMentionsTools(handleExceptionsAndWeirdCasesSkill, [
			'inspect_questlog_item',
			'search_questlog',
			'review_questlog',
			'shape_work',
			'organize_work',
			'plan_quest',
			'run_quest',
		]);
		expectSkillAvoidsDirectApi(handleExceptionsAndWeirdCasesSkill, [
			'getQuestDetail',
			'searchQuestlog',
			'startQuest',
		]);

		const db = await createSkillTestDb();
		captureRumorTool.handler(db, {
			title: 'Alpha issue',
			details: 'One possible match.',
			now: 1,
		});
		captureRumorTool.handler(db, {
			title: 'Alpha escalation',
			details: 'Second possible match.',
			now: 2,
		});

		const ambiguous = expectClarification(
			searchQuestlogTool.handler(db, {
				query: 'Alpha',
				mode: 'identify_one',
			}),
		);
		strictEqual(ambiguous.clarification.code, 'ambiguous_target');

		const missingTarget = expectError(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: 9999 },
			}),
		);
		strictEqual(missingTarget.error.code, 'not_found');
	});
});
