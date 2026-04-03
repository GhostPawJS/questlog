import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { captureRumorTool } from './capture_rumor_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import {
	createToolTestDb,
	expectClarification,
	expectError,
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

	it('updates a rumor title and details via update_rumor', () => {
		const captured = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Auth spike',
				now: 1,
			}),
		);

		const result = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'update_rumor',
				rumorId: captured.data.rumor.id,
				details: 'P99 spiking after deploy — Redis cache invalidation',
				now: 2,
			}),
		);

		strictEqual(result.data.rumor?.title, 'Auth spike');
		strictEqual(result.data.rumor?.details, 'P99 spiking after deploy — Redis cache invalidation');
		strictEqual(result.data.rumor?.updatedAt, 2);
	});

	it('rejects update_rumor on a settled rumor', () => {
		const captured = expectSuccess(
			captureRumorTool.handler(db, { title: 'Already settled', now: 1 }),
		);
		expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'settle_rumor',
				rumorId: captured.data.rumor.id,
				quests: [{ title: 'Task', objective: 'Do it' }],
				settledAt: 2,
			}),
		);

		const result = expectError(
			shapeWorkTool.handler(db, {
				action: 'update_rumor',
				rumorId: captured.data.rumor.id,
				details: 'Too late',
			}),
		);

		strictEqual(result.error.kind, 'domain');
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
