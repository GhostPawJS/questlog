import type { QuestlogDb } from '../database.ts';
import { softDeleteQuestline } from '../questlines/soft_delete_questline.ts';
import { softDeleteQuest } from '../quests/soft_delete_quest.ts';
import { softDeleteRepeatableQuest } from '../repeatable_quests/soft_delete_repeatable_quest.ts';
import { softDeleteRumor } from '../rumors/soft_delete_rumor.ts';
import { translateToolError } from './tool_errors.ts';
import { defineQuestlogTool, enumSchema, integerSchema, objectSchema } from './tool_metadata.ts';
import { retireWorkToolName } from './tool_names.ts';
import type { ToolResult } from './tool_types.ts';
import { toolNoOp, toolSuccess } from './tool_types.ts';

export interface RetireWorkToolInput {
	action: 'hide';
	deletedAt?: number;
	target:
		| { id: number; kind: 'quest' }
		| { id: number; kind: 'questline' }
		| { id: number; kind: 'repeatable_quest' }
		| { id: number; kind: 'rumor' };
}

export interface RetireWorkToolData {
	action: 'hide';
	target: RetireWorkToolInput['target'];
}

export type RetireWorkToolResult = ToolResult<RetireWorkToolData>;

function readRetireStatus(
	db: QuestlogDb,
	target: RetireWorkToolInput['target'],
): { deletedAt: number | null; title: string | null } | null {
	switch (target.kind) {
		case 'rumor': {
			const row = db.prepare('SELECT title, deleted_at FROM rumors WHERE id = ?').get(target.id);
			if (!row) {
				return null;
			}
			return {
				deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
				title: row.title == null ? null : String(row.title),
			};
		}
		case 'quest': {
			const row = db.prepare('SELECT title, deleted_at FROM quests WHERE id = ?').get(target.id);
			if (!row) {
				return null;
			}
			return {
				deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
				title: row.title == null ? null : String(row.title),
			};
		}
		case 'questline': {
			const row = db
				.prepare('SELECT title, deleted_at FROM questlines WHERE id = ?')
				.get(target.id);
			if (!row) {
				return null;
			}
			return {
				deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
				title: row.title == null ? null : String(row.title),
			};
		}
		case 'repeatable_quest': {
			const row = db
				.prepare('SELECT title, deleted_at FROM repeatable_quests WHERE id = ?')
				.get(target.id);
			if (!row) {
				return null;
			}
			return {
				deletedAt: row.deleted_at == null ? null : Number(row.deleted_at),
				title: row.title == null ? null : String(row.title),
			};
		}
	}
}

export function retireWorkToolHandler(
	db: QuestlogDb,
	input: RetireWorkToolInput,
): RetireWorkToolResult {
	try {
		const status = readRetireStatus(db, input.target);
		if (status?.deletedAt != null) {
			return toolNoOp(
				`${input.target.kind} \`${status.title ?? input.target.id}\` is already hidden.`,
				{
					action: input.action,
					target: input.target,
				},
				{
					entities: [
						{ kind: input.target.kind, id: input.target.id, title: status.title ?? undefined },
					],
				},
			);
		}

		switch (input.target.kind) {
			case 'rumor':
				softDeleteRumor(db, input.target.id, input.deletedAt);
				break;
			case 'quest':
				softDeleteQuest(db, input.target.id, input.deletedAt);
				break;
			case 'questline':
				softDeleteQuestline(db, input.target.id, input.deletedAt);
				break;
			case 'repeatable_quest':
				softDeleteRepeatableQuest(db, input.target.id, input.deletedAt);
				break;
		}

		return toolSuccess(
			`Hid ${input.target.kind} ${input.target.id}.`,
			{
				action: input.action,
				target: input.target,
			},
			{
				entities: [
					{ kind: input.target.kind, id: input.target.id, title: status?.title ?? undefined },
				],
			},
		);
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not hide ${input.target.kind} ${input.target.id}.`,
		});
	}
}

export const retireWorkTool = defineQuestlogTool<RetireWorkToolInput, RetireWorkToolResult>({
	name: retireWorkToolName,
	description:
		'Hide an item from normal active operation without rewriting history by soft-deleting a rumor, quest, questline, or repeatable quest.',
	whenToUse:
		'Use this when work should disappear from active reads while preserving historical truth.',
	whenNotToUse:
		'Do not use this when you mean to archive a questline or repeatable quest while keeping it visible as retired structure.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['quest', 'questline', 'repeatable_quest', 'rumor'],
	inputDescriptions: {
		action: 'The retirement action to perform. This tool currently supports hiding an item.',
		target: 'The rumor, quest, questline, or repeatable quest to hide.',
		deletedAt: 'Optional timestamp to record when the item became hidden.',
	},
	outputDescription:
		'Returns a structured success result for the hidden target, or a structured no-op when the target is already hidden.',
	inputSchema: objectSchema(
		{
			action: enumSchema('The retirement action to perform.', ['hide']),
			target: objectSchema(
				{
					kind: enumSchema('The kind of item to hide.', [
						'quest',
						'questline',
						'repeatable_quest',
						'rumor',
					]),
					id: integerSchema('The numeric id of the item to hide.'),
				},
				['kind', 'id'],
				'The target to hide.',
			),
			deletedAt: integerSchema('Optional timestamp to record when the item became hidden.'),
		},
		['action', 'target'],
		'Hide a questlog item without rewriting history.',
	),
	handler: retireWorkToolHandler,
});
