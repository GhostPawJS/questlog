import assert from 'node:assert/strict';
import { test } from 'node:test';
import { questlogMcpOptions } from './questlog_mcp_options.ts';

test('MCP annotations describe read, destructive, and local-only operations', () => {
	const options = questlogMcpOptions(() => {
		throw new Error('unused');
	});
	for (const tool of options.tools) {
		const annotations = options.annotations?.(tool);
		assert.equal(annotations?.readOnlyHint, tool.readOnly);
		assert.equal(annotations?.idempotentHint, tool.readOnly);
		assert.equal(annotations?.openWorldHint, false);
		if (tool.readOnly) assert.equal(annotations?.destructiveHint, false);
		if (
			[
				'retire_work',
				'run_quest',
				'organize_work',
				'tag_work',
				'reward_work',
				'manage_repeatable',
				'shape_work',
			].includes(tool.name)
		)
			assert.equal(annotations?.destructiveHint, true);
	}
});
