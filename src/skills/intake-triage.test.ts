import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	captureRumorTool,
	inspectQuestlogItemTool,
	searchQuestlogTool,
	shapeWorkTool,
} from '../tools/index.ts';
import { intakeTriageSkill } from './intake-triage.ts';
import {
	createSkillTestDb,
	expectClarification,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('intakeTriageSkill', () => {
	it('captures unclear work, inspects it, handles duplicate ambiguity, and supports safe dismissal', async () => {
		expectSkillMentionsTools(intakeTriageSkill, [
			'search_questlog',
			'capture_rumor',
			'inspect_questlog_item',
			'shape_work',
		]);
		expectSkillAvoidsDirectApi(intakeTriageSkill, [
			'captureRumor',
			'searchQuestlog',
			'dismissRumor',
		]);

		const db = await createSkillTestDb();
		const firstRumor = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Vendor terms changed',
				details: 'Urgent but unclear legal concern.',
				now: 1,
			}),
		);
		const rumorId = firstRumor.data.rumor.id;

		const inspected = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'rumor', id: rumorId },
			}),
		);
		strictEqual(inspected.data.item.kind, 'rumor');

		expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Vendor pricing changed',
				details: 'Potential duplicate intake from procurement.',
				now: 2,
			}),
		);

		const ambiguous = expectClarification(
			searchQuestlogTool.handler(db, {
				query: 'Vendor',
				mode: 'identify_one',
			}),
		);
		strictEqual(ambiguous.clarification.code, 'ambiguous_target');

		expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'dismiss_rumor',
				rumorId,
				dismissedAt: 3,
			}),
		);

		const dismissedAgain = expectNoOp(
			shapeWorkTool.handler(db, {
				action: 'dismiss_rumor',
				rumorId,
				dismissedAt: 4,
			}),
		);
		strictEqual(dismissedAgain.data.action, 'dismiss_rumor');
	});
});
