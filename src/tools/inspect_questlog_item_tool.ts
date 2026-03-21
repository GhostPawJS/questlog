import { getQuestlineDetail } from '../questlines/get_questline_detail.ts';
import { getQuestDetail } from '../quests/get_quest_detail.ts';
import { getRepeatableQuestOrThrow } from '../repeatable_quests/get_repeatable_quest_or_throw.ts';
import type { RepeatableQuest } from '../repeatable_quests/types.ts';
import { getRumorDetail } from '../rumors/get_rumor_detail.ts';
import type { RumorDetail } from '../rumors/types.ts';
import { translateToolError } from './tool_errors.ts';
import { defineQuestlogTool, enumSchema, integerSchema, objectSchema } from './tool_metadata.ts';
import { inspectQuestlogItemToolName } from './tool_names.ts';
import {
	toQuestlineRef,
	toQuestRef,
	toRepeatableQuestRef,
	toRewardRef,
	toRumorRef,
} from './tool_ref.ts';
import type { ToolEntityRef, ToolResult } from './tool_types.ts';
import { toolSuccess } from './tool_types.ts';

export interface InspectQuestlogItemToolInput {
	target:
		| { kind: 'quest'; id: number }
		| { kind: 'questline'; id: number }
		| { kind: 'repeatable_quest'; id: number }
		| { kind: 'rumor'; id: number };
	detailLevel?: 'compact' | 'full';
	now?: number;
}

export interface InspectQuestlogItemToolData {
	item: QuestInspectItem;
	related: ToolEntityRef[];
	detailLevel: 'compact' | 'full';
}

interface QuestCompactDetail {
	id: number;
	title: string;
	objective: string;
	state: ReturnType<typeof getQuestDetail>['state'];
	markerId: ReturnType<typeof getQuestDetail>['markerId'];
	available: boolean;
	effectiveDueAt: number | null;
	tagNames: string[];
	questlineId: number | null;
	sourceRumorId: number | null;
	spawnedFromRepeatableId: number | null;
}

interface QuestlineCompactDetail {
	id: number;
	title: string;
	description: string | null;
	dueAt: number | null;
	archivedAt: number | null;
	totalQuests: number;
	availableQuests: number;
	overdueQuests: number;
	sourceRumorId: number | null;
}

interface RepeatableQuestCompactDetail {
	id: number;
	title: string;
	objective: string;
	rrule: string;
	anchorAt: number;
	questlineId: number | null;
	archivedAt: number | null;
	deletedAt: number | null;
}

interface RumorCompactDetail {
	id: number;
	title: string;
	details: string | null;
	state: RumorDetail['state'];
	markerId: RumorDetail['markerId'];
	outputs: RumorDetail['outputs'];
}

export type QuestInspectItem =
	| { kind: 'quest'; detail: QuestCompactDetail | ReturnType<typeof getQuestDetail> }
	| { kind: 'questline'; detail: QuestlineCompactDetail | ReturnType<typeof getQuestlineDetail> }
	| { kind: 'repeatable_quest'; detail: RepeatableQuestCompactDetail | RepeatableQuest }
	| { kind: 'rumor'; detail: RumorCompactDetail | RumorDetail };

export type InspectQuestlogItemToolResult = ToolResult<InspectQuestlogItemToolData>;

function toQuestCompactDetail(detail: ReturnType<typeof getQuestDetail>): QuestCompactDetail {
	return {
		id: detail.id,
		title: detail.title,
		objective: detail.objective,
		state: detail.state,
		markerId: detail.markerId,
		available: detail.available,
		effectiveDueAt: detail.effectiveDueAt,
		tagNames: detail.tagNames,
		questlineId: detail.questlineId,
		sourceRumorId: detail.sourceRumorId,
		spawnedFromRepeatableId: detail.spawnedFromRepeatableId,
	};
}

function toQuestlineCompactDetail(
	detail: ReturnType<typeof getQuestlineDetail>,
): QuestlineCompactDetail {
	return {
		id: detail.id,
		title: detail.title,
		description: detail.description,
		dueAt: detail.dueAt,
		archivedAt: detail.archivedAt,
		totalQuests: detail.totalQuests,
		availableQuests: detail.availableQuests,
		overdueQuests: detail.overdueQuests,
		sourceRumorId: detail.sourceRumorId,
	};
}

function toRepeatableQuestCompactDetail(detail: RepeatableQuest): RepeatableQuestCompactDetail {
	return {
		id: detail.id,
		title: detail.title,
		objective: detail.objective,
		rrule: detail.rrule,
		anchorAt: detail.anchorAt,
		questlineId: detail.questlineId,
		archivedAt: detail.archivedAt,
		deletedAt: detail.deletedAt,
	};
}

function toRumorCompactDetail(detail: RumorDetail): RumorCompactDetail {
	return {
		id: detail.id,
		title: detail.title,
		details: detail.details,
		state: detail.state,
		markerId: detail.markerId,
		outputs: detail.outputs,
	};
}

export function inspectQuestlogItemToolHandler(
	db: Parameters<typeof getQuestDetail>[0],
	input: InspectQuestlogItemToolInput,
): InspectQuestlogItemToolResult {
	const detailLevel = input.detailLevel ?? 'compact';
	try {
		switch (input.target.kind) {
			case 'quest': {
				const detail = getQuestDetail(db, input.target.id, input.now ?? Date.now());
				const entities = [toQuestRef(detail)];
				const related: ToolEntityRef[] = [];
				if (detail.questlineId != null) {
					related.push({ kind: 'questline', id: detail.questlineId });
				}
				if (detail.sourceRumorId != null) {
					related.push({ kind: 'rumor', id: detail.sourceRumorId });
				}
				if (detail.spawnedByQuestId != null) {
					related.push({ kind: 'quest', id: detail.spawnedByQuestId });
				}
				if (detail.spawnedFromRepeatableId != null) {
					related.push({ kind: 'repeatable_quest', id: detail.spawnedFromRepeatableId });
				}
				for (const reward of detail.rewards) {
					related.push(toRewardRef(reward));
				}
				return toolSuccess(
					`Loaded quest \`${detail.title}\`.`,
					{
						item: {
							kind: 'quest',
							detail: detailLevel === 'full' ? detail : toQuestCompactDetail(detail),
						},
						related,
						detailLevel,
					},
					{ entities },
				);
			}
			case 'questline': {
				const detail = getQuestlineDetail(db, input.target.id, input.now ?? Date.now());
				const entities = [toQuestlineRef(detail)];
				const related =
					detail.sourceRumorId == null
						? []
						: [{ kind: 'rumor' as const, id: detail.sourceRumorId }];
				return toolSuccess(
					`Loaded questline \`${detail.title}\`.`,
					{
						item: {
							kind: 'questline',
							detail: detailLevel === 'full' ? detail : toQuestlineCompactDetail(detail),
						},
						related,
						detailLevel,
					},
					{ entities },
				);
			}
			case 'repeatable_quest': {
				const detail = getRepeatableQuestOrThrow(db, input.target.id);
				const entities = [toRepeatableQuestRef(detail)];
				const related =
					detail.questlineId == null
						? []
						: [{ kind: 'questline' as const, id: detail.questlineId }];
				return toolSuccess(
					`Loaded repeatable quest \`${detail.title}\`.`,
					{
						item: {
							kind: 'repeatable_quest',
							detail: detailLevel === 'full' ? detail : toRepeatableQuestCompactDetail(detail),
						},
						related,
						detailLevel,
					},
					{ entities },
				);
			}
			case 'rumor': {
				const detail = getRumorDetail(db, input.target.id);
				const entities = [toRumorRef(detail)];
				const related = detail.outputs.map((output) => ({
					kind: output.entityKind,
					id: output.entityId,
				}));
				return toolSuccess(
					`Loaded rumor \`${detail.title}\`.`,
					{
						item: {
							kind: 'rumor',
							detail: detailLevel === 'full' ? detail : toRumorCompactDetail(detail),
						},
						related,
						detailLevel,
					},
					{ entities },
				);
			}
		}
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not inspect ${input.target.kind} ${input.target.id}.`,
			entities: [{ kind: input.target.kind, id: input.target.id }],
		});
	}
}

export const inspectQuestlogItemTool = defineQuestlogTool<
	InspectQuestlogItemToolInput,
	InspectQuestlogItemToolResult
>({
	name: inspectQuestlogItemToolName,
	description:
		'Inspect one specific questlog item in depth and return its richer structured detail and important related refs.',
	whenToUse:
		'Use this when you already know the target item id and want either compact or full detail for one rumor, quest, questline, or repeatable quest.',
	whenNotToUse: 'Do not use this to discover items when the exact target is not known yet.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: false,
	targetKinds: ['quest', 'questline', 'repeatable_quest', 'rumor'],
	inputDescriptions: {
		target: 'The specific item to inspect, identified by its kind and numeric id.',
		detailLevel:
			'Use `compact` by default for low-token summaries, or `full` when you need the entire domain detail payload.',
		now: 'Optional evaluation timestamp used when inspecting time-sensitive quest or questline detail.',
	},
	outputDescription:
		'Returns one detail payload for the requested item plus compact refs for related downstream or linked items. Compact detail is the default to reduce token load, while full detail preserves the original richer domain shape.',
	inputSchema: objectSchema(
		{
			target: objectSchema(
				{
					kind: enumSchema('The kind of item to inspect.', [
						'quest',
						'questline',
						'repeatable_quest',
						'rumor',
					]),
					id: integerSchema('The numeric id of the item to inspect.'),
				},
				['kind', 'id'],
				'The specific item to inspect.',
			),
			detailLevel: enumSchema('How much detail to return.', ['compact', 'full']),
			now: integerSchema('Optional evaluation timestamp for time-sensitive detail.'),
		},
		['target'],
		'Inspect one specific questlog item.',
	),
	handler: inspectQuestlogItemToolHandler,
});
