import { ok, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { captureRumorTool } from './capture_rumor_tool.ts';
import { createToolTestDb, expectError, expectSuccess } from './tool_test_utils.ts';

describe('captureRumorTool', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createToolTestDb();
	});

	it('rejects empty rumor titles as invalid input', () => {
		const result = expectError(
			captureRumorTool.handler(db, {
				title: '   ',
			}),
		);

		strictEqual(result.error.kind, 'protocol');
		strictEqual(result.error.code, 'invalid_input');
	});

	it('returns follow-up hints for inspecting and shaping the rumor', () => {
		const result = expectSuccess(
			captureRumorTool.handler(db, {
				title: 'Legal question',
				now: 5,
			}),
		);

		strictEqual(result.data.rumor.createdAt, 5);
		ok(result.next?.some((hint) => hint.kind === 'inspect_item'));
		ok(result.next?.some((hint) => hint.kind === 'use_tool' && hint.tool === 'shape_work'));
	});
});
