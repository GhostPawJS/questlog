import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	toolFailure,
	toolNeedsClarification,
	toolNoOp,
	toolSuccess,
	toolWarning,
} from './tool_types.ts';

describe('tool result helpers', () => {
	it('build success and no-op envelopes with legal combinations', () => {
		const success = toolSuccess(
			'Loaded item.',
			{ value: 1 },
			{
				entities: [{ kind: 'quest', id: 1 }],
				warnings: [toolWarning('partial_match', 'Used a partial match.')],
			},
		);
		const noOp = toolNoOp('Nothing changed.', { value: 1 });

		strictEqual(success.ok, true);
		strictEqual(success.outcome, 'success');
		deepStrictEqual(Object.keys(success).sort(), [
			'data',
			'entities',
			'ok',
			'outcome',
			'summary',
			'warnings',
		]);

		strictEqual(noOp.ok, true);
		strictEqual(noOp.outcome, 'no_op');
		ok('data' in noOp);
		ok(!('error' in noOp));
		ok(!('clarification' in noOp));
	});

	it('builds clarification envelopes without data or errors', () => {
		const result = toolNeedsClarification(
			'missing_required_choice',
			'Which day should be reviewed?',
			['filters.dayAt'],
			{
				options: [{ label: 'Today', value: 'today' }],
			},
		);

		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
		ok('clarification' in result);
		ok(!('data' in result));
		ok(!('error' in result));
		deepStrictEqual(result.clarification.missing, ['filters.dayAt']);
	});

	it('builds failure envelopes with explicit error kind metadata', () => {
		const result = toolFailure('protocol', 'invalid_input', 'Bad request.', 'Query is required.', {
			recovery: 'Provide a non-empty query.',
			details: { field: 'query' },
		});

		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'error');
		strictEqual(result.error.kind, 'protocol');
		strictEqual(result.error.code, 'invalid_input');
		strictEqual(result.error.recovery, 'Provide a non-empty query.');
		deepStrictEqual(result.error.details, { field: 'query' });
		ok(!('data' in result));
		ok(!('clarification' in result));
	});
});
