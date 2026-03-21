import { throws } from 'node:assert';
import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reviewQuestlogTool } from './review_questlog_tool.ts';
import {
	createToolTestDb,
	expectClarification,
	expectError,
	expectNoOp,
	expectSuccess,
} from './tool_test_utils.ts';
import { toolFailure, toolNeedsClarification, toolSuccess } from './tool_types.ts';

describe('tool_test_utils', () => {
	it('creates initialized test databases and accepts representative matching outcomes', async () => {
		const db = await createToolTestDb();
		const review = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'rumors',
			}),
		);

		strictEqual(review.ok, true);
		strictEqual(expectSuccess(toolSuccess('ok', { id: 1 })).data.id, 1);
		strictEqual(
			expectClarification(toolNeedsClarification('missing_required_choice', 'Need more.', ['x']))
				.clarification.missing[0],
			'x',
		);
		strictEqual(
			expectError(toolFailure('protocol', 'invalid_input', 'Bad input.', 'Nope.')).error.code,
			'invalid_input',
		);
	});

	it('throws when helper expectations are used on the wrong outcome kind', () => {
		throws(() => expectError(toolSuccess('ok', { id: 1 })));
		throws(() => expectClarification(toolFailure('system', 'system_error', 'Boom.', 'Boom.')));
		throws(() => expectNoOp(toolSuccess('ok', { id: 1 })));
	});
});
