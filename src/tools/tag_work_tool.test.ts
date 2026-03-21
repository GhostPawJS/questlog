import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { manageRepeatableTool } from './manage_repeatable_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import { tagWorkTool } from './tag_work_tool.ts';
import { createToolTestDb, expectError, expectNoOp, expectSuccess } from './tool_test_utils.ts';

describe('tagWorkTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('returns a no-op when adding tags that are already present', () => {
		const created = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Tag target',
					objective: 'Keep duplicate add idempotent.',
				},
			}),
		);
		if (!created.data.quest) {
			throw new Error('expected created quest');
		}

		expectSuccess(
			tagWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: created.data.quest.id },
				tagNames: ['ops', 'ops', '  ops  '],
			}),
		);

		const result = expectNoOp(
			tagWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: created.data.quest.id },
				tagNames: ['ops'],
			}),
		);

		strictEqual(result.data.tagNames[0], 'ops');
	});

	it('rejects non-replace tag actions on repeatable quests', () => {
		const repeatable = expectSuccess(
			manageRepeatableTool.handler(db, {
				action: 'create',
				repeatableQuest: {
					title: 'Repeatable tags',
					objective: 'Use template tags only.',
					rrule: 'FREQ=DAILY',
					anchorAt: 0,
				},
			}),
		);
		if (!repeatable.data.repeatableQuest) {
			throw new Error('expected repeatable quest');
		}

		const invalidInput = {
			action: 'add',
			target: { kind: 'repeatable_quest', id: repeatable.data.repeatableQuest.id },
			tagNames: ['ops'],
		} as unknown as Parameters<typeof tagWorkTool.handler>[1];

		const result = expectError(tagWorkTool.handler(db, invalidInput));

		strictEqual(result.error.kind, 'protocol');
		strictEqual(result.error.code, 'unsupported_target');
	});
});
