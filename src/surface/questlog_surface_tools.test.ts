import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateInput } from '../surfaces/validate_input.ts';
import { questlogSurfaceTools } from './questlog_surface_tools.ts';

const inputs: Record<string, Record<string, unknown>> = {
	search_questlog: {
		query: 'planning',
	},
	review_questlog: {
		view: 'quests.open',
	},
	inspect_questlog_item: {
		target: {
			kind: 'quest',
			id: 1,
		},
	},
	capture_rumor: {
		title: 'Review planning',
	},
	shape_work: {
		action: 'create_quest',
		quest: {
			title: 'Review',
			objective: 'Read notes',
		},
	},
	plan_quest: {
		action: 'set_time',
		questId: 1,
		dueAt: 100,
	},
	run_quest: {
		action: 'start',
		questId: 1,
	},
	organize_work: {
		action: 'add_unlock',
		fromQuestId: 1,
		toQuestId: 2,
	},
	manage_repeatable: {
		action: 'preview_due',
	},
	tag_work: {
		action: 'add',
		target: {
			kind: 'quest',
			id: 1,
		},
		tagNames: ['review'],
	},
	reward_work: {
		action: 'claim',
		target: {
			kind: 'reward',
			id: 1,
		},
	},
	retire_work: {
		action: 'hide',
		target: {
			kind: 'quest',
			id: 1,
		},
	},
};
test('every Questlog schema accepts representative handler inputs and rejects invalid shapes', () => {
	for (const tool of questlogSurfaceTools) {
		assert.ok(inputs[tool.name], tool.name);
		assert.deepEqual(validateInput(tool.inputSchema, inputs[tool.name]), [], tool.name);
		assert.ok(validateInput(tool.inputSchema, []).length, tool.name);
		for (const required of tool.inputSchema.required ?? []) {
			const input = { ...inputs[tool.name] };
			delete input[required];
			assert.ok(validateInput(tool.inputSchema, input).length, `${tool.name}.${required}`);
		}
	}
});
