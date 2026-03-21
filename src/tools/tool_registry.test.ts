import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { questlogToolMappings } from './tool_mapping.ts';
import {
	getQuestlogToolByName,
	listQuestlogToolDefinitions,
	questlogTools,
} from './tool_registry.ts';

function topLevelSchemaFields(tool: (typeof questlogTools)[number]): string[] {
	const direct = Object.keys(tool.inputSchema.properties ?? {});
	const fromOneOf = (tool.inputSchema.oneOf ?? []).flatMap((schema) =>
		Object.keys(schema.properties ?? {}),
	);
	return [...new Set([...direct, ...fromOneOf])];
}

describe('tool registry', () => {
	it('exports unique runtime-ready tool definitions', () => {
		const names = questlogTools.map((tool) => tool.name);
		const uniqueNames = new Set(names);

		strictEqual(questlogTools.length, 12);
		strictEqual(uniqueNames.size, questlogTools.length);

		for (const tool of questlogTools) {
			ok(tool.name.trim().length > 0);
			ok(tool.description.trim().length > 0);
			ok(tool.whenToUse.trim().length > 0);
			ok(tool.outputDescription.trim().length > 0);
			ok(Object.keys(tool.inputDescriptions).length > 0);
			ok(tool.sideEffects === 'none' || tool.sideEffects === 'writes_state');
			ok(tool.targetKinds.length > 0);
			ok(tool.inputSchema.type === 'object' || (tool.inputSchema.oneOf?.length ?? 0) > 0);
			for (const field of topLevelSchemaFields(tool)) {
				ok(tool.inputDescriptions[field], `missing input description for ${tool.name}.${field}`);
			}
			if (tool.readOnly) {
				strictEqual(tool.sideEffects, 'none');
			}
			strictEqual(getQuestlogToolByName(tool.name), tool);
		}

		deepStrictEqual(listQuestlogToolDefinitions(), [...questlogTools]);

		deepStrictEqual(names, [
			'search_questlog',
			'review_questlog',
			'inspect_questlog_item',
			'capture_rumor',
			'shape_work',
			'plan_quest',
			'run_quest',
			'organize_work',
			'manage_repeatable',
			'tag_work',
			'reward_work',
			'retire_work',
		]);
	});

	it('exposes a public-api reconciliation matrix', () => {
		ok(questlogToolMappings.length >= 49);
		ok(
			questlogToolMappings.some(
				(mapping) => mapping.source === 'searchQuestlog' && mapping.tool === 'search_questlog',
			),
		);
		ok(
			questlogToolMappings.some(
				(mapping) =>
					mapping.source === 'abandonQuestAndSpawnFollowups' &&
					mapping.tool === 'run_quest' &&
					mapping.action === 'abandon_and_spawn_followups',
			),
		);
		ok(
			questlogToolMappings.some(
				(mapping) =>
					mapping.source === 'softDeleteRepeatableQuest' &&
					mapping.tool === 'retire_work' &&
					mapping.notes?.includes('Canonical hide path'),
			),
		);
	});
});
