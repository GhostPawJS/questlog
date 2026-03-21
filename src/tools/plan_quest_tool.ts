import { getQuestDetail, planQuestTime, reviseQuestObjective } from '../quests/index.ts';
import type { PlanQuestTimeInput } from '../quests/types.ts';
import { translateToolError } from './tool_errors.ts';
import {
	booleanSchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { planQuestToolName } from './tool_names.ts';
import { toQuestRef } from './tool_ref.ts';
import type { ToolResult } from './tool_types.ts';
import { toolNoOp, toolSuccess } from './tool_types.ts';

export type PlanQuestToolInput =
	| { action: 'revise_objective'; now?: number; objective: string; questId: number }
	| ({ action: 'set_time'; questId: number } & PlanQuestTimeInput);

export interface PlanQuestToolData {
	action: PlanQuestToolInput['action'];
	quest: ReturnType<typeof getQuestDetail>;
}

export type PlanQuestToolResult = ToolResult<PlanQuestToolData>;

function samePlanningState(
	current: ReturnType<typeof getQuestDetail>,
	input: PlanQuestTimeInput,
): boolean {
	return (
		(input.notBeforeAt === undefined || input.notBeforeAt === current.notBeforeAt) &&
		(input.dueAt === undefined || input.dueAt === current.dueAt) &&
		(input.scheduledStartAt === undefined || input.scheduledStartAt === current.scheduledStartAt) &&
		(input.scheduledEndAt === undefined || input.scheduledEndAt === current.scheduledEndAt) &&
		(input.allDay === undefined || input.allDay === current.allDay) &&
		(input.estimateSeconds === undefined || input.estimateSeconds === current.estimateSeconds)
	);
}

export function planQuestToolHandler(
	db: Parameters<typeof getQuestDetail>[0],
	input: PlanQuestToolInput,
): PlanQuestToolResult {
	try {
		const current = getQuestDetail(db, input.questId);

		if (input.action === 'revise_objective') {
			const nextObjective = input.objective.trim();
			if (nextObjective === current.objective) {
				return toolNoOp(
					`Quest \`${current.title}\` already has that objective.`,
					{
						action: input.action,
						quest: current,
					},
					{
						entities: [toQuestRef(current)],
					},
				);
			}
			reviseQuestObjective(db, input.questId, input.objective, input.now);
			const detail = getQuestDetail(db, input.questId);
			return toolSuccess(
				`Revised quest objective for \`${detail.title}\`.`,
				{
					action: input.action,
					quest: detail,
				},
				{
					entities: [toQuestRef(detail)],
				},
			);
		}

		if (samePlanningState(current, input)) {
			return toolNoOp(
				`Quest \`${current.title}\` already has that planning state.`,
				{
					action: input.action,
					quest: current,
				},
				{
					entities: [toQuestRef(current)],
				},
			);
		}

		planQuestTime(db, input.questId, input);
		const detail = getQuestDetail(db, input.questId);
		return toolSuccess(
			`Updated planning for quest \`${detail.title}\`.`,
			{
				action: input.action,
				quest: detail,
			},
			{
				entities: [toQuestRef(detail)],
			},
		);
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not complete plan-quest action \`${input.action}\`.`,
		});
	}
}

export const planQuestTool = defineQuestlogTool<PlanQuestToolInput, PlanQuestToolResult>({
	name: planQuestToolName,
	description:
		'Refine a quest by revising its objective before actual start or by changing its temporal planning fields.',
	whenToUse:
		'Use this when you need to sharpen what the quest means or how it is timed without starting or resolving it.',
	whenNotToUse:
		'Do not use this for lifecycle execution such as start, finish, abandon, or effort logging.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['quest'],
	inputDescriptions: {
		action: 'Whether to revise the quest objective or update the quest timing and estimate fields.',
		questId: 'The concrete quest to refine.',
		objective: 'The new quest objective text for the revise-objective action.',
		notBeforeAt: 'Optional earliest actionable timestamp for the quest.',
		dueAt: 'Optional latest acceptable completion timestamp for the quest.',
		scheduledStartAt: 'Optional planned schedule window start timestamp.',
		scheduledEndAt: 'Optional planned schedule window end timestamp.',
		allDay: 'Whether the scheduled window should be treated as all-day.',
		estimateSeconds: 'Optional estimate of active effort in seconds.',
		now: 'Optional timestamp for updating the quest.',
	},
	outputDescription:
		'Returns the updated quest detail after objective or planning changes. If the requested planning state is already present, the tool returns a structured no-op result.',
	inputSchema: {
		oneOf: [
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['revise_objective']),
					now: integerSchema('Optional update timestamp.'),
					objective: stringSchema('The new quest objective text.'),
					questId: integerSchema('The quest to refine.'),
				},
				['action', 'questId', 'objective'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['set_time']),
					questId: integerSchema('The quest to refine.'),
					notBeforeAt: integerSchema('Optional earliest actionable timestamp.'),
					dueAt: integerSchema('Optional latest acceptable completion timestamp.'),
					scheduledStartAt: integerSchema('Optional planned schedule window start.'),
					scheduledEndAt: integerSchema('Optional planned schedule window end.'),
					allDay: booleanSchema('Whether the planned schedule window is all-day.'),
					estimateSeconds: integerSchema('Optional active-effort estimate in seconds.'),
					now: integerSchema('Optional update timestamp.'),
				},
				['action', 'questId'],
			),
		],
		description: 'Refine a quest objective or planning state.',
	},
	handler: planQuestToolHandler,
});
