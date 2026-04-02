import { getQuestDetail } from '../quests/get_quest_detail.ts';
import { getRepeatableQuestOrThrow } from '../repeatable_quests/get_repeatable_quest_or_throw.ts';
import {
	archiveRepeatableQuest,
	createRepeatableQuest,
	listDueRepeatableQuestAnchors,
	spawnDueRepeatableQuests,
	updateRepeatableQuest,
} from '../repeatable_quests/index.ts';
import type {
	CreateRepeatableQuestInput,
	UpdateRepeatableQuestInput,
} from '../repeatable_quests/types.ts';
import { translateToolError } from './tool_errors.ts';
import {
	booleanSchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { manageRepeatableToolName } from './tool_names.ts';
import { toQuestRef, toRepeatableAnchorListItem, toRepeatableQuestRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolListItem, ToolResult } from './tool_types.ts';
import { toolNoOp, toolSuccess, toolWarning } from './tool_types.ts';

export type ManageRepeatableToolInput =
	| { action: 'archive'; archivedAt?: number; repeatableQuestId: number }
	| { action: 'create'; repeatableQuest: CreateRepeatableQuestInput }
	| { action: 'preview_due'; now?: number }
	| { action: 'spawn_due'; now: number }
	| ({ action: 'update'; repeatableQuestId: number } & UpdateRepeatableQuestInput);

export interface ManageRepeatableToolData {
	action: ManageRepeatableToolInput['action'];
	primary?: ToolEntityRef | undefined;
	created?: ToolEntityRef[] | undefined;
	updated?: ToolEntityRef[] | undefined;
	items?: ToolListItem[] | undefined;
	repeatableQuest?: ReturnType<typeof getRepeatableQuestOrThrow> | undefined;
	spawnedQuests?: Array<ReturnType<typeof getQuestDetail>> | undefined;
}

export type ManageRepeatableToolResult = ToolResult<ManageRepeatableToolData>;

export function manageRepeatableToolHandler(
	db: Parameters<typeof createRepeatableQuest>[0],
	input: ManageRepeatableToolInput,
): ManageRepeatableToolResult {
	try {
		switch (input.action) {
			case 'preview_due': {
				const now = input.now ?? Date.now();
				const items = listDueRepeatableQuestAnchors(db, now).map((anchor) =>
					toRepeatableAnchorListItem(
						anchor,
						getRepeatableQuestOrThrow(db, anchor.repeatableQuestId),
					),
				);
				return toolSuccess(
					items.length === 0
						? 'No repeatable quest anchors are currently due.'
						: `Found ${items.length} due repeatable anchors.`,
					{
						action: input.action,
						created: [],
						updated: [],
						items,
					},
					{
						entities: items.map((item) => ({
							kind: item.kind,
							id: item.id,
							title: item.title,
							markerId: item.markerId,
							state: item.state,
						})),
						warnings:
							items.length === 0
								? [toolWarning('empty_result', 'No repeatable anchors are due right now.')]
								: undefined,
					},
				);
			}
			case 'spawn_due': {
				const spawned = spawnDueRepeatableQuests(db, input.now);
				if (spawned.length === 0) {
					return toolNoOp(
						'No repeatable quest anchors were due to spawn.',
						{
							action: input.action,
							created: [],
							spawnedQuests: [],
						},
						{
							warnings: [toolWarning('empty_result', 'There was nothing due to materialize.')],
						},
					);
				}
				const spawnedQuests = spawned.map((quest) => getQuestDetail(db, quest.id));
				return toolSuccess(
					`Spawned ${spawnedQuests.length} repeatable quest occurrences.`,
					{
						action: input.action,
						created: spawnedQuests.map(toQuestRef),
						spawnedQuests,
					},
					{
						entities: spawnedQuests.map(toQuestRef),
					},
				);
			}
			case 'create': {
				const repeatableQuest = createRepeatableQuest(db, input.repeatableQuest);
				return toolSuccess(
					`Created repeatable quest \`${repeatableQuest.title}\`.`,
					{
						action: input.action,
						primary: toRepeatableQuestRef(repeatableQuest),
						created: [toRepeatableQuestRef(repeatableQuest)],
						repeatableQuest,
					},
					{
						entities: [toRepeatableQuestRef(repeatableQuest)],
					},
				);
			}
			case 'update': {
				const repeatableQuest = updateRepeatableQuest(db, input.repeatableQuestId, input);
				return toolSuccess(
					`Updated repeatable quest \`${repeatableQuest.title}\`.`,
					{
						action: input.action,
						primary: toRepeatableQuestRef(repeatableQuest),
						updated: [toRepeatableQuestRef(repeatableQuest)],
						repeatableQuest,
					},
					{
						entities: [toRepeatableQuestRef(repeatableQuest)],
					},
				);
			}
			case 'archive': {
				const current = getRepeatableQuestOrThrow(db, input.repeatableQuestId);
				if (current.archivedAt != null) {
					return toolNoOp(
						`Repeatable quest \`${current.title}\` is already archived.`,
						{
							action: input.action,
							primary: toRepeatableQuestRef(current),
							repeatableQuest: current,
						},
						{
							entities: [toRepeatableQuestRef(current)],
						},
					);
				}
				const repeatableQuest = archiveRepeatableQuest(
					db,
					input.repeatableQuestId,
					input.archivedAt,
				);
				return toolSuccess(
					`Archived repeatable quest \`${repeatableQuest.title}\`.`,
					{
						action: input.action,
						primary: toRepeatableQuestRef(repeatableQuest),
						updated: [toRepeatableQuestRef(repeatableQuest)],
						repeatableQuest,
					},
					{
						entities: [toRepeatableQuestRef(repeatableQuest)],
					},
				);
			}
		}
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not complete manage-repeatable action \`${input.action}\`.`,
		});
	}
}

export const manageRepeatableTool = defineQuestlogTool<
	ManageRepeatableToolInput,
	ManageRepeatableToolResult
>({
	name: manageRepeatableToolName,
	description:
		'Manage recurring work definitions by creating, updating, previewing, spawning, or archiving repeatable quests.',
	whenToUse:
		'Use this when the work is a repeatable template or when due recurring anchors need to be previewed or materialized.',
	whenNotToUse:
		'Do not use this for one-off concrete quest execution, for inspecting an existing concrete quest, or for hiding a repeatable quest. Use `retire_work` for hiding.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['repeatable_quest', 'quest'],
	inputDescriptions: {
		action: 'Which repeatable quest lifecycle action to perform.',
		repeatableQuest: 'The repeatable quest creation input used for the create action.',
		repeatableQuestId: 'The repeatable quest definition being updated or archived.',
		rrule: 'Optional new RRULE that changes future materialization behavior.',
		anchorAt: 'Optional new recurrence anchor timestamp for future materialization.',
		notBeforeOffsetSeconds:
			'Optional not-before offset in seconds applied to future spawned quests.',
		dueOffsetSeconds: 'Optional due offset in seconds applied to future spawned quests.',
		scheduledStartOffsetSeconds:
			'Optional scheduled-start offset in seconds applied to future spawned quests.',
		scheduledEndOffsetSeconds:
			'Optional scheduled-end offset in seconds applied to future spawned quests.',
		allDay: 'Whether future spawned schedule windows should be treated as all-day.',
		estimateSeconds: 'Optional active-effort estimate in seconds for future spawned quests.',
		title: 'Optional new repeatable quest title.',
		objective: 'Optional new repeatable quest objective.',
		questlineId: 'Optional questline that should own the repeatable quest.',
		archivedAt: 'Optional archive timestamp for the archive action.',
		now: 'Evaluation or spawn timestamp for previewing or materializing due anchors.',
	},
	outputDescription:
		'Returns the changed repeatable quest, due anchor preview items, or spawned quest details for the selected recurrence action. Empty previews and empty spawns return structured success or no-op results, and repeatable hiding is now intentionally routed through `retire_work`.',
	inputSchema: {
		type: 'object',
		oneOf: [
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['archive']),
					archivedAt: integerSchema('Optional archive timestamp.'),
					repeatableQuestId: integerSchema('Repeatable quest to archive.'),
				},
				['action', 'repeatableQuestId'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['create']),
					repeatableQuest: objectSchema(
						{
							title: stringSchema('Title for the new repeatable quest.'),
							objective: stringSchema('Objective for the new repeatable quest.'),
							rrule: stringSchema('RRULE describing recurrence.'),
							anchorAt: integerSchema('Recurrence anchor timestamp.'),
						},
						['title', 'objective', 'rrule', 'anchorAt'],
					),
				},
				['action', 'repeatableQuest'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['preview_due']),
					now: integerSchema('Evaluation timestamp for due anchors.'),
				},
				['action'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['spawn_due']),
					now: integerSchema('Evaluation timestamp for materializing due anchors.'),
				},
				['action', 'now'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['update']),
					repeatableQuestId: integerSchema('Repeatable quest to update.'),
					title: stringSchema('Optional new title.'),
					objective: stringSchema('Optional new objective.'),
					questlineId: integerSchema('Optional new questline id.'),
					rrule: stringSchema('Optional new RRULE.'),
					anchorAt: integerSchema('Optional new recurrence anchor timestamp.'),
					notBeforeOffsetSeconds: integerSchema('Optional new not-before offset in seconds.'),
					dueOffsetSeconds: integerSchema('Optional new due offset in seconds.'),
					scheduledStartOffsetSeconds: integerSchema(
						'Optional new scheduled-start offset in seconds.',
					),
					scheduledEndOffsetSeconds: integerSchema('Optional new scheduled-end offset in seconds.'),
					allDay: booleanSchema('Whether future schedules are all-day.'),
					estimateSeconds: integerSchema('Optional new effort estimate.'),
					archivedAt: integerSchema('Optional archive timestamp.'),
					now: integerSchema('Optional update timestamp.'),
				},
				['action', 'repeatableQuestId'],
			),
		],
		description: 'Manage repeatable quest definitions and due materialization.',
	},
	handler: manageRepeatableToolHandler,
});
