import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as toolNames from './tool_names.ts';
import { questlogTools } from './tool_registry.ts';

describe('tool_names', () => {
	it('exports unique canonical tool names that match the registry set', () => {
		const names = Object.values(toolNames);

		strictEqual(names.length, 12);
		strictEqual(new Set(names).size, names.length);
		for (const name of names) {
			strictEqual(/^[a-z]+(?:_[a-z]+)*$/.test(name), true);
		}

		deepStrictEqual([...names].sort(), questlogTools.map((tool) => tool.name).sort());
	});
});
