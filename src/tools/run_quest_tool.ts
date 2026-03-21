import {
	abandonQuest,
	abandonQuestAndSpawnFollowups,
	finishQuest,
	getQuestDetail,
	logQuestEffort,
	startQuest,
} from '../quests/index.ts';
import type { FollowupQuestInput } from '../quests/types.ts';
import { translateToolError } from './tool_errors.ts';
import {
	arraySchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { runQuestToolName } from './tool_names.ts';
import { inspectItemNext } from './tool_next.ts';
import { toQuestRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolResult } from './tool_types.ts';
import { toolFailure, toolNoOp, toolSuccess } from './tool_types.ts';

export type RunQuestToolInput =
	| { action: 'abandon'; outcome: string; questId: number; resolvedAt?: number }
	| {
			action: 'abandon_and_spawn_followups';
			followups: FollowupQuestInput[];
			outcome: string;
			questId: number;
			resolvedAt?: number;
	  }
	| { action: 'finish'; outcome: string; questId: number; resolvedAt?: number }
	| { action: 'log_effort'; effortSeconds: number; now?: number; questId: number }
	| { action: 'start'; questId: number; startedAt?: number };

export interface RunQuestToolData {
	action: RunQuestToolInput['action'];
	primary: ToolEntityRef;
	created?: ToolEntityRef[] | undefined;
	updated?: ToolEntityRef[] | undefined;
	followupQuests?: Array<ReturnType<typeof getQuestDetail>> | undefined;
	quest: ReturnType<typeof getQuestDetail>;
}

export type RunQuestToolResult = ToolResult<RunQuestToolData>;

export function runQuestToolHandler(
	db: Parameters<typeof getQuestDetail>[0],
	input: RunQuestToolInput,
): RunQuestToolResult {
	try {
		const current = getQuestDetail(db, input.questId);

		switch (input.action) {
			case 'start': {
				if (current.resolvedAt != null) {
					return translateToolError(new Error('Resolved quests cannot be started.'), {
						summary: `Could not start quest \`${current.title}\`.`,
						entities: [toQuestRef(current)],
					});
				}
				if (current.startedAt != null) {
					return toolNoOp(
						`Quest \`${current.title}\` is already started.`,
						{
							action: input.action,
							primary: toQuestRef(current),
							quest: current,
						},
						{
							entities: [toQuestRef(current)],
						},
					);
				}
				startQuest(db, input.questId, input.startedAt);
				const detail = getQuestDetail(db, input.questId);
				return toolSuccess(
					`Started quest \`${detail.title}\`.`,
					{
						action: input.action,
						primary: toQuestRef(detail),
						updated: [toQuestRef(detail)],
						quest: detail,
					},
					{
						entities: [toQuestRef(detail)],
					},
				);
			}
			case 'log_effort': {
				logQuestEffort(db, input.questId, input.effortSeconds, input.now);
				const detail = getQuestDetail(db, input.questId);
				return toolSuccess(
					`Logged effort on quest \`${detail.title}\`.`,
					{
						action: input.action,
						primary: toQuestRef(detail),
						updated: [toQuestRef(detail)],
						quest: detail,
					},
					{
						entities: [toQuestRef(detail)],
					},
				);
			}
			case 'finish': {
				finishQuest(db, input.questId, input.outcome, input.resolvedAt);
				const detail = getQuestDetail(db, input.questId);
				return toolSuccess(
					`Finished quest \`${detail.title}\`.`,
					{
						action: input.action,
						primary: toQuestRef(detail),
						updated: [toQuestRef(detail)],
						quest: detail,
					},
					{
						entities: [toQuestRef(detail)],
					},
				);
			}
			case 'abandon': {
				abandonQuest(db, input.questId, input.outcome, input.resolvedAt);
				const detail = getQuestDetail(db, input.questId);
				return toolSuccess(
					`Abandoned quest \`${detail.title}\`.`,
					{
						action: input.action,
						primary: toQuestRef(detail),
						updated: [toQuestRef(detail)],
						quest: detail,
					},
					{
						entities: [toQuestRef(detail)],
					},
				);
			}
			case 'abandon_and_spawn_followups': {
				if (input.followups.length === 0) {
					return toolFailure(
						'protocol',
						'invalid_input',
						'Follow-up quests are required for this action.',
						'Provide at least one follow-up quest, or use the plain abandon action instead.',
						{
							entities: [toQuestRef(current)],
						},
					);
				}
				const result = abandonQuestAndSpawnFollowups(
					db,
					input.questId,
					input.outcome,
					input.followups,
					input.resolvedAt,
				);
				const detail = getQuestDetail(db, input.questId);
				const followupQuests = result.followupQuests.map((quest) => getQuestDetail(db, quest.id));
				return toolSuccess(
					`Abandoned quest \`${detail.title}\` and created follow-up work.`,
					{
						action: input.action,
						primary: toQuestRef(detail),
						created: followupQuests.map(toQuestRef),
						updated: [toQuestRef(detail)],
						quest: detail,
						followupQuests,
					},
					{
						entities: [toQuestRef(detail), ...followupQuests.map(toQuestRef)],
						next:
							followupQuests.length === 1 && followupQuests[0]
								? [inspectItemNext(toQuestRef(followupQuests[0]))]
								: undefined,
					},
				);
			}
		}
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not complete run-quest action \`${input.action}\`.`,
		});
	}
}

export const runQuestTool = defineQuestlogTool<RunQuestToolInput, RunQuestToolResult>({
	name: runQuestToolName,
	description:
		'Run quest lifecycle actions such as starting, logging effort, finishing, abandoning, or abandoning and spawning follow-up quests atomically.',
	whenToUse: 'Use this for actual execution lifecycle steps after the quest already exists.',
	whenNotToUse: 'Do not use this for work shaping, planning-only edits, tagging, or rewards.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['quest'],
	inputDescriptions: {
		action: 'Which execution lifecycle step to perform on the quest.',
		questId: 'The concrete quest whose execution state should change.',
		startedAt: 'Optional actual start timestamp for the start action.',
		effortSeconds: 'Positive active-effort increment in seconds for the log-effort action.',
		now: 'Optional timestamp for the effort log action.',
		outcome: 'Terminal outcome text for finish or abandon actions.',
		resolvedAt: 'Optional terminal timestamp for finish or abandon actions.',
		followups:
			'Follow-up quest creation inputs used only for the abandon-and-spawn-followups action.',
	},
	outputDescription:
		'Returns the updated quest detail after the selected lifecycle action, plus purpose-shaped primary, updated, and created refs when follow-up work is spawned. Safe repeated starts return structured no-op results.',
	inputSchema: {
		oneOf: [
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['abandon']),
					outcome: stringSchema('Terminal outcome text.'),
					questId: integerSchema('Quest to abandon.'),
					resolvedAt: integerSchema('Optional resolved timestamp.'),
				},
				['action', 'questId', 'outcome'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['abandon_and_spawn_followups']),
					followups: arraySchema(
						objectSchema(
							{
								title: stringSchema('Title for a follow-up quest.'),
								objective: stringSchema('Objective for a follow-up quest.'),
							},
							['title', 'objective'],
						),
						'Follow-up quests to create atomically.',
					),
					outcome: stringSchema('Terminal outcome text.'),
					questId: integerSchema('Quest to abandon.'),
					resolvedAt: integerSchema('Optional resolved timestamp.'),
				},
				['action', 'questId', 'outcome', 'followups'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['finish']),
					outcome: stringSchema('Terminal outcome text.'),
					questId: integerSchema('Quest to finish.'),
					resolvedAt: integerSchema('Optional resolved timestamp.'),
				},
				['action', 'questId', 'outcome'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['log_effort']),
					effortSeconds: integerSchema('Positive active-effort increment in seconds.'),
					now: integerSchema('Optional effort-log timestamp.'),
					questId: integerSchema('Quest to update.'),
				},
				['action', 'questId', 'effortSeconds'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['start']),
					questId: integerSchema('Quest to start.'),
					startedAt: integerSchema('Optional start timestamp.'),
				},
				['action', 'questId'],
			),
		],
		description: 'Run quest lifecycle actions.',
	},
	handler: runQuestToolHandler,
});
