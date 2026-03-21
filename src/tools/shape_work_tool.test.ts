import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { captureRumorTool } from './capture_rumor_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import {
	createToolTestDb,
	expectClarification,
	expectNoOp,
	expectSuccess,
} from './tool_test_utils.ts';

describe('shapeWorkTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('asks how to settle a rumor when downstream structure is missing', () => {
		const captured = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Settle later',
				now: 1,
			}),
		);

		const result = expectClarification(
			shapeWorkTool.handler(db, {
				action: 'settle_rumor',
				rumorId: captured.data.rumor.id,
			}),
		);

		deepStrictEqual(result.clarification.missing, ['questline', 'quests']);
	});

	it('returns a no-op when dismissing an already dismissed rumor', () => {
		const captured = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Not actionable',
				now: 1,
			}),
		);

		expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'dismiss_rumor',
				rumorId: captured.data.rumor.id,
				dismissedAt: 2,
			}),
		);

		const result = expectNoOp(
			shapeWorkTool.handler(db, {
				action: 'dismiss_rumor',
				rumorId: captured.data.rumor.id,
				dismissedAt: 3,
			}),
		);

		strictEqual(result.data.rumor?.state, 'dismissed');
	});
});
