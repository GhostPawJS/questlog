import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	captureRumorTool,
	inspectQuestlogItemTool,
	manageRepeatableTool,
	shapeWorkTool,
} from '../tools/index.ts';
import { chooseWorkShapeSkill } from './choose-work-shape.ts';
import {
	createSkillTestDb,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('chooseWorkShapeSkill', () => {
	it('chooses rumor, quest, and repeatable shapes without collapsing them together', async () => {
		expectSkillMentionsTools(chooseWorkShapeSkill, [
			'capture_rumor',
			'shape_work',
			'manage_repeatable',
			'inspect_questlog_item',
		]);
		expectSkillAvoidsDirectApi(chooseWorkShapeSkill, [
			'createQuest',
			'createQuestline',
			'createRepeatableQuest',
		]);

		const db = await createSkillTestDb();
		const rumor = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Maybe sponsor outreach',
				details: 'Still unclear whether this should become execution work.',
				now: 1,
			}),
		);
		strictEqual(rumor.data.rumor.title, 'Maybe sponsor outreach');

		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Draft sponsor outreach note',
					objective: 'Prepare one clear outreach draft.',
				},
			}),
		);
		strictEqual(quest.data.quest?.title, 'Draft sponsor outreach note');

		const repeatable = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'create',
				repeatableQuest: {
					title: 'Weekly sponsor review',
					objective: 'Review sponsor pipeline every week.',
					rrule: 'FREQ=WEEKLY',
					anchorAt: 0,
				},
			}),
		);
		strictEqual(repeatable.data.repeatableQuest?.title, 'Weekly sponsor review');

		const inspected = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'repeatable_quest', id: repeatable.data.repeatableQuest?.id ?? 0 },
			}),
		);
		strictEqual(inspected.data.item.kind, 'repeatable_quest');
	});
});
