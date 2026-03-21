import { deepStrictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	askUserNext,
	inspectItemNext,
	retryWithNext,
	reviewViewNext,
	useToolNext,
} from './tool_next.ts';

describe('tool_next helpers', () => {
	it('builds inspect-item and review-view hints with suggested input', () => {
		deepStrictEqual(inspectItemNext({ kind: 'quest', id: 7 }), {
			kind: 'inspect_item',
			message: 'Inspect quest 7 for full detail.',
			tool: 'inspect_questlog_item',
			suggestedInput: {
				target: {
					kind: 'quest',
					id: 7,
				},
			},
		});
		deepStrictEqual(reviewViewNext('quests.available', { filters: { questlineId: 3 } }), {
			kind: 'review_view',
			message: 'Review the `quests.available` operational view next.',
			tool: 'review_questlog',
			suggestedInput: {
				view: 'quests.available',
				filters: { questlineId: 3 },
			},
		});
	});

	it('builds retry, use-tool, and ask-user hints', () => {
		deepStrictEqual(retryWithNext('Retry with a valid id.', { questId: 3 }), {
			kind: 'retry_with',
			message: 'Retry with a valid id.',
			suggestedInput: { questId: 3 },
		});
		deepStrictEqual(useToolNext('shape_work', 'Create the quest.', { action: 'create_quest' }), {
			kind: 'use_tool',
			message: 'Create the quest.',
			tool: 'shape_work',
			suggestedInput: { action: 'create_quest' },
		});
		deepStrictEqual(askUserNext('Which quest did you mean?'), {
			kind: 'ask_user',
			message: 'Which quest did you mean?',
		});
	});
});
