import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	inspectQuestlogItemTool,
	manageRepeatableTool,
	reviewQuestlogTool,
} from '../tools/index.ts';
import { runRecurringRhythmsSkill } from './run-recurring-rhythms.ts';
import {
	createSkillTestDb,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('runRecurringRhythmsSkill', () => {
	it('creates a repeatable, previews due anchors, spawns due work, and treats empty future spawn as no-op', async () => {
		expectSkillMentionsTools(runRecurringRhythmsSkill, [
			'manage_repeatable',
			'review_questlog',
			'inspect_questlog_item',
			'run_quest',
		]);
		expectSkillAvoidsDirectApi(runRecurringRhythmsSkill, [
			'createRepeatableQuest',
			'listDueRepeatableQuestAnchors',
			'spawnDueRepeatableQuests',
		]);

		const db = await createSkillTestDb();
		const repeatable = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'create',
				repeatableQuest: {
					title: 'Weekly review',
					objective: 'Review the portfolio every week.',
					rrule: 'FREQ=DAILY',
					anchorAt: 0,
				},
			}),
		);

		const dueAnchors = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'repeatables.due_anchors',
				now: 0,
			}),
		);
		strictEqual(dueAnchors.data.count, 1);

		const spawned = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'spawn_due',
				now: 0,
			}),
		);
		strictEqual(spawned.data.spawnedQuests?.length, 1);

		const spawnedQuest = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: spawned.data.spawnedQuests?.[0]?.id ?? 0 },
			}),
		);
		strictEqual(spawnedQuest.data.item.kind, 'quest');

		const nothingLeft = expectNoOp(
			manageRepeatableTool.handler(db, {
				action: 'spawn_due',
				now: 0,
			}),
		);
		strictEqual(nothingLeft.data.action, 'spawn_due');

		strictEqual(repeatable.data.repeatableQuest?.id != null, true);
	});
});
