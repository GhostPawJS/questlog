import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectQuestlogItemTool, shapeWorkTool } from '../tools/index.ts';
import { createConcreteQuestSkill } from './create-concrete-quest.ts';
import {
	createSkillTestDb,
	expectError,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('createConcreteQuestSkill', () => {
	it('creates a bounded quest and rejects invalid concrete quest input', async () => {
		expectSkillMentionsTools(createConcreteQuestSkill, [
			'shape_work',
			'inspect_questlog_item',
			'plan_quest',
		]);
		expectSkillAvoidsDirectApi(createConcreteQuestSkill, ['createQuest', 'getQuestDetail']);

		const db = await createSkillTestDb();
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Draft launch memo',
					objective: 'Write the first concrete launch memo draft.',
				},
			}),
		);
		const questId = created.data.quest?.id ?? 0;
		strictEqual(created.data.quest?.title, 'Draft launch memo');

		const inspected = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: questId },
				detailLevel: 'full',
			}),
		);
		strictEqual(inspected.data.item.kind, 'quest');

		const invalid = expectError(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: '',
					objective: 'This should fail because the title is empty.',
				},
			}),
		);
		strictEqual(invalid.error.code, 'invalid_input');
	});
});
