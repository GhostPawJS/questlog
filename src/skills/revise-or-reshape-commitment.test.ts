import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planQuestTool, runQuestTool, shapeWorkTool } from '../tools/index.ts';
import { reviseOrReshapeCommitmentSkill } from './revise-or-reshape-commitment.ts';
import {
	createSkillTestDb,
	expectError,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('reviseOrReshapeCommitmentSkill', () => {
	it('allows objective revision before start and requires reshape once execution has begun', async () => {
		expectSkillMentionsTools(reviseOrReshapeCommitmentSkill, [
			'inspect_questlog_item',
			'plan_quest',
			'run_quest',
		]);
		expectSkillAvoidsDirectApi(reviseOrReshapeCommitmentSkill, [
			'reviseQuestObjective',
			'startQuest',
			'abandonQuest',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Draft position',
					objective: 'Draft the first version.',
				},
			}),
		);
		const questId = quest.data.quest?.id ?? 0;

		const revised = expectSuccess(
			planQuestTool.handler(db, {
				action: 'revise_objective',
				questId,
				objective: 'Draft the version that is ready for review.',
			}),
		);
		strictEqual(revised.data.quest.objective, 'Draft the version that is ready for review.');

		expectSuccess(
			runQuestTool.handler(db, {
				action: 'start',
				questId,
			}),
		);

		const forbiddenRevision = expectError(
			planQuestTool.handler(db, {
				action: 'revise_objective',
				questId,
				objective: 'This rewrite should fail after start.',
			}),
		);
		strictEqual(forbiddenRevision.error.code, 'invalid_state');
	});
});
