import { ok, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import {
	captureRumorTool,
	inspectQuestlogItemTool,
	manageRepeatableTool,
	organizeWorkTool,
	planQuestTool,
	retireWorkTool,
	reviewQuestlogTool,
	rewardWorkTool,
	runQuestTool,
	searchQuestlogTool,
	shapeWorkTool,
	tagWorkTool,
} from './index.ts';
import type { ToolResult, ToolSuccess } from './tool_types.ts';

function expectSuccess<T>(result: ToolResult<T>): ToolSuccess<T> {
	strictEqual(result.ok, true);
	return result;
}

describe('tool facade integration', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createInitializedQuestlogDb();
	});

	it('supports capture, search, inspect, settle, and review flows', () => {
		const captured = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Vendor terms changed',
				details: 'Legal flagged revised pricing and termination terms.',
				now: 10,
			}),
		);
		const rumorId = captured.data.rumor.id;

		const search = expectSuccess(
			searchQuestlogTool.handler(db, {
				query: 'Vendor',
			}),
		);
		strictEqual(search.data.items.length, 1);
		strictEqual(search.data.items[0]?.kind, 'rumor');

		const inspectedRumor = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'rumor', id: rumorId },
			}),
		);
		strictEqual(inspectedRumor.data.item.kind, 'rumor');
		strictEqual(inspectedRumor.data.item.detail.title, 'Vendor terms changed');

		const settled = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'settle_rumor',
				rumorId,
				settledAt: 20,
				questline: {
					title: 'Vendor Renewal',
					description: 'Shared context for the contract renewal work.',
				},
				quests: [
					{
						title: 'Review revised vendor terms',
						objective: 'Compare revised terms against the previous contract.',
					},
				],
			}),
		);
		strictEqual(settled.data.quests?.length, 1);
		ok(settled.data.questline);

		const available = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.available',
			}),
		);
		strictEqual(available.data.count, 1);
		strictEqual(available.data.items[0]?.kind, 'quest');
	});

	it('supports planning, execution, dependencies, tags, and rewards', () => {
		const questA = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Draft launch memo',
					objective: 'Write the first pass of the launch memo.',
				},
			}),
		).data.quest;
		const questB = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Approve launch memo',
					objective: 'Review and approve the draft memo.',
				},
			}),
		).data.quest;
		ok(questA);
		ok(questB);

		const organized = expectSuccess(
			organizeWorkTool.handler(db, {
				action: 'add_unlock',
				fromQuestId: questA.id,
				toQuestId: questB.id,
			}),
		);
		ok(organized.data.quest?.unlockedByQuestIds.includes(questA.id));

		const blocked = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.blocked',
			}),
		);
		strictEqual(blocked.data.count, 1);
		strictEqual(blocked.data.items[0]?.id, questB.id);

		const planned = expectSuccess(
			planQuestTool.handler(db, {
				action: 'set_time',
				questId: questA.id,
				dueAt: 1_000,
			}),
		);
		strictEqual(planned.data.quest.dueAt, 1_000);

		const started = expectSuccess(
			runQuestTool.handler(db, {
				action: 'start',
				questId: questA.id,
			}),
		);
		ok(started.data.quest.startedAt != null);

		const startedAgain = expectSuccess(
			runQuestTool.handler(db, {
				action: 'start',
				questId: questA.id,
			}),
		);
		strictEqual(startedAgain.outcome, 'no_op');

		const tagged = expectSuccess(
			tagWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: questA.id },
				tagNames: ['launch'],
			}),
		);
		strictEqual(tagged.data.tagNames[0], 'launch');

		const rewardAdded = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: questA.id },
				reward: {
					kind: 'recognition',
					name: 'Launch XP',
				},
			}),
		);
		ok(rewardAdded.data.reward);

		expectSuccess(
			runQuestTool.handler(db, {
				action: 'finish',
				questId: questA.id,
				outcome: 'Memo drafted and approved for review.',
			}),
		);

		const claimed = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'claim',
				target: { kind: 'reward', id: rewardAdded.data.reward?.id ?? 0 },
			}),
		);
		ok(claimed.data.reward?.claimedAt != null);

		const claimedAgain = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'claim',
				target: { kind: 'reward', id: rewardAdded.data.reward?.id ?? 0 },
				claimedAt: 251,
			}),
		);
		strictEqual(claimedAgain.outcome, 'no_op');
	});

	it('supports repeatable preview and spawn plus retirement', () => {
		const previewEmpty = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'preview_due',
				now: 0,
			}),
		);
		strictEqual(previewEmpty.data.items?.length ?? 0, 0);

		const repeatable = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'create',
				repeatableQuest: {
					title: 'Weekly review',
					objective: 'Review the portfolio for the week.',
					rrule: 'FREQ=DAILY',
					anchorAt: 0,
				},
			}),
		).data.repeatableQuest;
		ok(repeatable);

		const inspected = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'repeatable_quest', id: repeatable.id },
			}),
		);
		strictEqual(inspected.data.item.kind, 'repeatable_quest');

		const previewDue = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'preview_due',
				now: 0,
			}),
		);
		strictEqual(previewDue.data.items?.length, 1);

		const replacedRewards = expectSuccess(
			rewardWorkTool.handler(db, {
				action: 'replace_repeatable_template',
				target: { kind: 'repeatable_quest', id: repeatable.id },
				rewards: [
					{
						kind: 'xp',
						name: 'Weekly XP',
					},
				],
			}),
		);
		ok(replacedRewards.warnings);

		const spawned = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'spawn_due',
				now: 0,
			}),
		);
		strictEqual(spawned.data.spawnedQuests?.length, 1);

		const hidden = expectSuccess(
			retireWorkTool.handler(db, {
				action: 'hide',
				target: { kind: 'repeatable_quest', id: repeatable.id },
			}),
		);
		strictEqual(hidden.data.target.id, repeatable.id);

		const hiddenAgain = expectSuccess(
			retireWorkTool.handler(db, {
				action: 'hide',
				target: { kind: 'repeatable_quest', id: repeatable.id },
			}),
		);
		strictEqual(hiddenAgain.outcome, 'no_op');
	});
});
