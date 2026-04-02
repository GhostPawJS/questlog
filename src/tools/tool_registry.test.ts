import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	getQuestlogToolByName,
	listQuestlogToolDefinitions,
	questlogTools,
} from './tool_registry.ts';

function topLevelSchemaFields(tool: (typeof questlogTools)[number]): string[] {
	return Object.keys(tool.inputSchema.properties ?? {});
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
			strictEqual(
				tool.inputSchema.type,
				'object',
				`${tool.name} inputSchema must have type: "object" at root for cross-provider compatibility`,
			);
			ok(
				topLevelSchemaFields(tool).length > 0,
				`${tool.name} inputSchema must have non-empty properties`,
			);
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

	it('every tool inputSchema is a flat object with properties for cross-provider compatibility', () => {
		for (const tool of questlogTools) {
			strictEqual(
				tool.inputSchema.type,
				'object',
				`${tool.name}: root inputSchema.type must be "object"`,
			);
			strictEqual(
				tool.inputSchema.oneOf,
				undefined,
				`${tool.name}: root inputSchema must not use oneOf — flatten action variants into properties`,
			);
			ok(
				Object.keys(tool.inputSchema.properties ?? {}).length > 0,
				`${tool.name}: root inputSchema must have populated properties`,
			);
		}
	});

	it('multi-action tools expose all action variants in their flattened schema', () => {
		const expectedActions: Record<string, string[]> = {
			plan_quest: ['revise_objective', 'set_time'],
			run_quest: ['start', 'log_effort', 'finish', 'abandon', 'abandon_and_spawn_followups'],
			shape_work: [
				'attach_quest_to_questline',
				'create_quest',
				'create_questline',
				'detach_quest_from_questline',
				'dismiss_rumor',
				'reopen_rumor',
				'settle_rumor',
			],
			organize_work: [
				'add_unlock',
				'archive_questline',
				'remove_unlock',
				'replace_unlocks',
				'set_questline_fields',
			],
			manage_repeatable: ['archive', 'create', 'preview_due', 'spawn_due', 'update'],
			tag_work: ['add', 'remove', 'replace'],
			reward_work: ['add', 'claim', 'remove', 'replace_repeatable_template', 'update'],
			retire_work: ['hide'],
		};

		for (const [name, actions] of Object.entries(expectedActions)) {
			const tool = getQuestlogToolByName(name);
			ok(tool, `tool ${name} not found`);
			const actionProp = tool.inputSchema.properties?.action;
			ok(actionProp, `tool ${name} has no action property in schema`);
			deepStrictEqual(
				[...(actionProp.enum as string[])].sort(),
				[...actions].sort(),
				`${name}: action enum mismatch`,
			);
		}
	});

	it('shape_work quest schemas expose full CreateQuestInput fields for single-call creation', () => {
		const tool = getQuestlogToolByName('shape_work');
		ok(tool);

		const expectedQuestFields = [
			'title',
			'objective',
			'questlineId',
			'tags',
			'rewards',
			'dueAt',
			'notBeforeAt',
			'scheduledStartAt',
			'scheduledEndAt',
			'allDay',
			'estimateSeconds',
		];

		const questProps = tool.inputSchema.properties?.quest?.properties ?? {};
		deepStrictEqual(
			Object.keys(questProps).sort(),
			[...expectedQuestFields].sort(),
			'shape_work quest object must include timing, tags, and rewards for single-call creation',
		);

		const questsItemProps = tool.inputSchema.properties?.quests?.items?.properties ?? {};
		const expectedQuestsItemFields = expectedQuestFields.filter((f) => f !== 'questlineId');
		deepStrictEqual(
			Object.keys(questsItemProps).sort(),
			[...expectedQuestsItemFields].sort(),
			'shape_work quests[] items must include timing, tags, and rewards for single-call settlement',
		);

		const questlineProps = tool.inputSchema.properties?.questline?.properties ?? {};
		ok('title' in questlineProps, 'questline must have title');
		ok('description' in questlineProps, 'questline must have description');
	});

	it('multi-action tools list all variant properties at the root level', () => {
		const expectedProperties: Record<string, string[]> = {
			plan_quest: [
				'action',
				'questId',
				'objective',
				'notBeforeAt',
				'dueAt',
				'scheduledStartAt',
				'scheduledEndAt',
				'allDay',
				'estimateSeconds',
				'now',
			],
			run_quest: [
				'action',
				'questId',
				'startedAt',
				'effortSeconds',
				'now',
				'outcome',
				'resolvedAt',
				'followups',
			],
			shape_work: [
				'action',
				'questId',
				'questlineId',
				'quest',
				'questline',
				'rumorId',
				'dismissedAt',
				'settledAt',
				'quests',
				'now',
			],
			organize_work: [
				'action',
				'questlineId',
				'title',
				'description',
				'startsAt',
				'dueAt',
				'archivedAt',
				'toQuestId',
				'fromQuestId',
				'fromQuestIds',
				'now',
			],
			manage_repeatable: [
				'action',
				'repeatableQuestId',
				'repeatableQuest',
				'title',
				'objective',
				'questlineId',
				'rrule',
				'anchorAt',
				'notBeforeOffsetSeconds',
				'dueOffsetSeconds',
				'scheduledStartOffsetSeconds',
				'scheduledEndOffsetSeconds',
				'allDay',
				'estimateSeconds',
				'archivedAt',
				'now',
			],
			tag_work: ['action', 'target', 'tagNames', 'now'],
			reward_work: ['action', 'target', 'reward', 'rewards', 'claimedAt', 'now'],
		};

		for (const [name, properties] of Object.entries(expectedProperties)) {
			const tool = getQuestlogToolByName(name);
			ok(tool, `tool ${name} not found`);
			deepStrictEqual(
				Object.keys(tool.inputSchema.properties ?? {}).sort(),
				[...properties].sort(),
				`${name}: property set mismatch`,
			);
		}
	});
});
