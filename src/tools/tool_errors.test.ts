import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { translateToolError } from './tool_errors.ts';

describe('translateToolError', () => {
	it('maps not-found errors to a domain failure with a default search hint', () => {
		const result = translateToolError(new Error('Quest 42 was not found.'), {
			summary: 'Could not inspect quest 42.',
			entities: [{ kind: 'quest', id: 42 }],
		});

		strictEqual(result.error.kind, 'domain');
		strictEqual(result.error.code, 'not_found');
		strictEqual(result.summary, 'Could not inspect quest 42.');
		strictEqual(
			result.error.recovery,
			'Use search when the exact id is unknown, then retry with the correct target.',
		);
		deepStrictEqual(result.next?.[0], {
			kind: 'use_tool',
			message: 'Search for the correct item first if the id may be wrong.',
			tool: 'search_questlog',
		});
	});

	it('maps validation messages to protocol invalid-input failures', () => {
		const result = translateToolError(new Error('Tag name must not be empty.'));

		strictEqual(result.error.kind, 'protocol');
		strictEqual(result.error.code, 'invalid_input');
		strictEqual(result.error.recovery, 'Fix the invalid field values and retry.');
	});

	it('maps invalid-state and constraint failures into domain failures', () => {
		const invalidState = translateToolError(new Error('Resolved quests cannot be started.'));
		const constraint = translateToolError(new Error('A quest cannot unlock itself.'));

		strictEqual(invalidState.error.kind, 'domain');
		strictEqual(invalidState.error.code, 'invalid_state');
		strictEqual(constraint.error.kind, 'domain');
		strictEqual(constraint.error.code, 'constraint_violation');
	});

	it('falls back to a system error for unknown non-Error failures', () => {
		const result = translateToolError('boom');

		strictEqual(result.error.kind, 'system');
		strictEqual(result.error.code, 'system_error');
		strictEqual(result.error.message, 'Unexpected system error.');
	});
});
