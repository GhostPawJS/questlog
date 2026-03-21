import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	captureRumorTool,
	inspectQuestlogItemTool,
	reviewQuestlogTool,
	shapeWorkTool,
} from '../tools/index.ts';
import { settleRumorIntoStructureSkill } from './settle-rumor-into-structure.ts';
import {
	createSkillTestDb,
	expectClarification,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('settleRumorIntoStructureSkill', () => {
	it('settles ready intake into structure and verifies the result through inspect and review', async () => {
		expectSkillMentionsTools(settleRumorIntoStructureSkill, [
			'capture_rumor',
			'shape_work',
			'inspect_questlog_item',
			'review_questlog',
		]);
		expectSkillAvoidsDirectApi(settleRumorIntoStructureSkill, [
			'settleRumor',
			'getRumorDetail',
			'listAvailableQuests',
		]);

		const db = await createSkillTestDb();
		const rumor = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Vendor renewal work',
				details: 'Ready to split into real work.',
				now: 1,
			}),
		);

		const missingStructure = expectClarification(
			shapeWorkTool.handler(db, {
				action: 'settle_rumor',
				rumorId: rumor.data.rumor.id,
			}),
		);
		strictEqual(missingStructure.clarification.code, 'missing_required_choice');

		const settled = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'settle_rumor',
				rumorId: rumor.data.rumor.id,
				settledAt: 2,
				questline: {
					title: 'Vendor Renewal',
					description: 'Coordinate the renewal work.',
				},
				quests: [
					{
						title: 'Review vendor terms',
						objective: 'Compare the new terms against the current contract.',
					},
				],
			}),
		);
		strictEqual(settled.data.questline?.title, 'Vendor Renewal');
		strictEqual(settled.data.quests?.length, 1);

		const inspectedRumor = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'rumor', id: rumor.data.rumor.id },
			}),
		);
		strictEqual(inspectedRumor.data.item.kind, 'rumor');

		const available = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.available',
			}),
		);
		strictEqual(available.data.count, 1);
	});
});
