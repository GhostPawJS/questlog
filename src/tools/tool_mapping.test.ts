import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { questlogToolMappings } from './tool_mapping.ts';
import { questlogTools } from './tool_registry.ts';

describe('questlogToolMappings', () => {
	it('covers every public runtime tool with at least one source mapping', () => {
		const mappedTools = new Set(questlogToolMappings.map((mapping) => mapping.tool));

		deepStrictEqual([...mappedTools].sort(), questlogTools.map((tool) => tool.name).sort());
	});

	it('uses non-empty mapping fields and unique source-action pairs', () => {
		const keys = new Set<string>();

		for (const mapping of questlogToolMappings) {
			ok(mapping.source.trim().length > 0);
			ok(mapping.tool.trim().length > 0);
			if (mapping.action) {
				ok(mapping.action.trim().length > 0);
			}
			const key = `${mapping.source}:${mapping.action ?? ''}`;
			strictEqual(keys.has(key), false, `duplicate mapping key ${key}`);
			keys.add(key);
		}
	});

	it('preserves important boundary notes for folded and canonical paths', () => {
		strictEqual(
			questlogToolMappings.some(
				(mapping) =>
					mapping.source === 'getRepeatableQuestOrThrow' &&
					mapping.tool === 'inspect_questlog_item' &&
					mapping.notes?.includes('Internal read used'),
			),
			true,
		);
		strictEqual(
			questlogToolMappings.some(
				(mapping) =>
					mapping.source === 'softDeleteRepeatableQuest' &&
					mapping.tool === 'retire_work' &&
					mapping.notes?.includes('Canonical hide path'),
			),
			true,
		);
	});
});
