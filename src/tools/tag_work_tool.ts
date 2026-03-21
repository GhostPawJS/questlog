import { assertActiveRowExists } from '../assert_active_row_exists';
import type { QuestlogDb } from '../database';
import { replaceQuestTags, replaceRepeatableQuestTags, tagQuest, untagQuest } from '../tags';
import { translateToolError } from './tool_errors';
import {
	arraySchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata';
import { tagWorkToolName } from './tool_names';
import type { ToolResult } from './tool_types';
import { toolFailure, toolNoOp, toolSuccess } from './tool_types';

export type TagWorkToolInput =
	| { action: 'add'; now?: number; tagNames: string[]; target: { id: number; kind: 'quest' } }
	| {
			action: 'remove';
			now?: number;
			tagNames: string[];
			target: { id: number; kind: 'quest' };
	  }
	| {
			action: 'replace';
			now?: number;
			tagNames: string[];
			target: { id: number; kind: 'quest' | 'repeatable_quest' };
	  };

export interface TagWorkToolData {
	action: TagWorkToolInput['action'];
	tagNames: string[];
	target: TagWorkToolInput['target'];
}

export type TagWorkToolResult = ToolResult<TagWorkToolData>;

function normalizeTagNames(tagNames: string[]): string[] {
	return [...new Set(tagNames.map((tag) => tag.trim()).filter(Boolean))];
}

function readQuestTagNames(db: QuestlogDb, questId: number): string[] {
	return db
		.prepare(
			`SELECT t.name
       FROM quest_tags qt
       JOIN tags t ON t.id = qt.tag_id
       WHERE qt.quest_id = ? AND qt.deleted_at IS NULL AND t.deleted_at IS NULL
       ORDER BY t.name ASC`,
		)
		.all(questId)
		.map((row) => String(row.name));
}

function readRepeatableTagNames(db: QuestlogDb, repeatableQuestId: number): string[] {
	return db
		.prepare(
			`SELECT t.name
       FROM repeatable_quest_tags rqt
       JOIN tags t ON t.id = rqt.tag_id
       WHERE rqt.repeatable_quest_id = ? AND rqt.deleted_at IS NULL AND t.deleted_at IS NULL
       ORDER BY t.name ASC`,
		)
		.all(repeatableQuestId)
		.map((row) => String(row.name));
}

export function tagWorkToolHandler(db: QuestlogDb, input: TagWorkToolInput): TagWorkToolResult {
	try {
		const normalized = normalizeTagNames(input.tagNames);
		if (input.target.kind === 'quest') {
			assertActiveRowExists(db, 'quests', input.target.id, 'Quest');
			const current = readQuestTagNames(db, input.target.id);
			const currentSet = new Set(current.map((name) => name.trim().toLowerCase()));
			const normalizedSet = new Set(normalized.map((name) => name.trim().toLowerCase()));

			if (input.action === 'add') {
				if (normalized.every((name) => currentSet.has(name.trim().toLowerCase()))) {
					return toolNoOp(
						'Those tags are already present on the quest.',
						{
							action: input.action,
							target: input.target,
							tagNames: current,
						},
						{
							entities: [{ kind: 'quest', id: input.target.id }],
						},
					);
				}
				tagQuest(db, input.target.id, normalized, input.now);
			} else if (input.action === 'remove') {
				if (normalized.every((name) => !currentSet.has(name.trim().toLowerCase()))) {
					return toolNoOp(
						'None of those tags are present on the quest.',
						{
							action: input.action,
							target: input.target,
							tagNames: current,
						},
						{
							entities: [{ kind: 'quest', id: input.target.id }],
						},
					);
				}
				untagQuest(db, input.target.id, normalized, input.now);
			} else {
				const same =
					currentSet.size === normalizedSet.size &&
					[...currentSet].every((value) => normalizedSet.has(value));
				if (same) {
					return toolNoOp(
						'The quest already has exactly that tag set.',
						{
							action: input.action,
							target: input.target,
							tagNames: current,
						},
						{
							entities: [{ kind: 'quest', id: input.target.id }],
						},
					);
				}
				replaceQuestTags(db, input.target.id, normalized, input.now);
			}

			return toolSuccess(
				'Updated quest tags.',
				{
					action: input.action,
					target: input.target,
					tagNames: readQuestTagNames(db, input.target.id),
				},
				{
					entities: [{ kind: 'quest', id: input.target.id }],
				},
			);
		}

		if (input.action !== 'replace') {
			return toolFailure(
				'protocol',
				'unsupported_target',
				'Repeatable quest tags only support replacement.',
				'Use the replace action when changing the future auto-tag template set for a repeatable quest.',
				{
					entities: [{ kind: 'repeatable_quest', id: input.target.id }],
				},
			);
		}

		assertActiveRowExists(db, 'repeatable_quests', input.target.id, 'Repeatable quest');
		const current = readRepeatableTagNames(db, input.target.id);
		const currentSet = new Set(current.map((name) => name.trim().toLowerCase()));
		const normalizedSet = new Set(normalized.map((name) => name.trim().toLowerCase()));
		const same =
			currentSet.size === normalizedSet.size &&
			[...currentSet].every((value) => normalizedSet.has(value));
		if (same) {
			return toolNoOp(
				'The repeatable quest already has exactly that future tag template set.',
				{
					action: input.action,
					target: input.target,
					tagNames: current,
				},
				{
					entities: [{ kind: 'repeatable_quest', id: input.target.id }],
				},
			);
		}

		replaceRepeatableQuestTags(db, input.target.id, normalized, input.now);
		return toolSuccess(
			'Updated repeatable quest future tags.',
			{
				action: input.action,
				target: input.target,
				tagNames: readRepeatableTagNames(db, input.target.id),
			},
			{
				entities: [{ kind: 'repeatable_quest', id: input.target.id }],
			},
		);
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not complete tag-work action \`${input.action}\`.`,
		});
	}
}

export const tagWorkTool = defineQuestlogTool<TagWorkToolInput, TagWorkToolResult>({
	name: tagWorkToolName,
	description:
		'Classify work by adding, removing, or replacing tags on quests and by replacing the future tag template set on repeatable quests.',
	whenToUse:
		'Use this when you want classification, reporting, or saved-filter semantics rather than lifecycle or dependency semantics.',
	whenNotToUse: 'Do not use tags to model status, time planning, or hard prerequisites.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['quest', 'repeatable_quest'],
	inputDescriptions: {
		action: 'Whether to add, remove, or replace tags on the chosen target.',
		target: 'The quest or repeatable quest whose tag set should change.',
		tagNames: 'The tag names to add, remove, or make the full replacement set.',
		now: 'Optional timestamp for the tag mutation.',
	},
	outputDescription:
		'Returns the normalized final tag set for the target after the selected tag action. Repeated equivalent changes return structured no-op results.',
	inputSchema: {
		oneOf: [
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['add']),
					now: integerSchema('Optional timestamp for the tag mutation.'),
					tagNames: arraySchema(stringSchema('Tag name.'), 'Tags to add.'),
					target: objectSchema(
						{
							id: integerSchema('Quest id.'),
							kind: enumSchema('Target kind.', ['quest']),
						},
						['id', 'kind'],
					),
				},
				['action', 'target', 'tagNames'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['remove']),
					now: integerSchema('Optional timestamp for the tag mutation.'),
					tagNames: arraySchema(stringSchema('Tag name.'), 'Tags to remove.'),
					target: objectSchema(
						{
							id: integerSchema('Quest id.'),
							kind: enumSchema('Target kind.', ['quest']),
						},
						['id', 'kind'],
					),
				},
				['action', 'target', 'tagNames'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['replace']),
					now: integerSchema('Optional timestamp for the tag mutation.'),
					tagNames: arraySchema(
						stringSchema('Tag name.'),
						'Tags to make the full replacement set.',
					),
					target: objectSchema(
						{
							id: integerSchema('Target id.'),
							kind: enumSchema('Target kind.', ['quest', 'repeatable_quest']),
						},
						['id', 'kind'],
					),
				},
				['action', 'target', 'tagNames'],
			),
		],
		description: 'Mutate tags on quests or repeatable quests.',
	},
	handler: tagWorkToolHandler,
});
