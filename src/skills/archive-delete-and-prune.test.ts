import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { manageRepeatableTool, retireWorkTool } from '../tools/index.ts';
import { archiveDeleteAndPruneSkill } from './archive-delete-and-prune.ts';
import {
	createSkillTestDb,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('archiveDeleteAndPruneSkill', () => {
	it('archives repeatables for future behavior and uses retire_work as the canonical hide path', async () => {
		expectSkillMentionsTools(archiveDeleteAndPruneSkill, [
			'shape_work',
			'organize_work',
			'manage_repeatable',
			'retire_work',
			'run_quest',
		]);
		expectSkillAvoidsDirectApi(archiveDeleteAndPruneSkill, [
			'softDeleteRepeatableQuest',
			'archiveRepeatableQuest',
			'abandonQuest',
		]);

		const db = await createSkillTestDb();
		const repeatable = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'create',
				repeatableQuest: {
					title: 'Monthly cleanup',
					objective: 'Run the monthly cleanup.',
					rrule: 'FREQ=MONTHLY',
					anchorAt: 0,
				},
			}),
		);
		const repeatableId = repeatable.data.repeatableQuest?.id ?? 0;

		const archived = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'archive',
				repeatableQuestId: repeatableId,
			}),
		);
		strictEqual(archived.data.repeatableQuest?.archivedAt != null, true);

		expectSuccess(
			retireWorkTool.handler(db, {
				action: 'hide',
				target: { kind: 'repeatable_quest', id: repeatableId },
			}),
		);

		const hiddenAgain = expectNoOp(
			retireWorkTool.handler(db, {
				action: 'hide',
				target: { kind: 'repeatable_quest', id: repeatableId },
			}),
		);
		strictEqual(hiddenAgain.data.target.kind, 'repeatable_quest');
	});
});
