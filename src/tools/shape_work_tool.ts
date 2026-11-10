import { getQuestlineDetail } from '../questlines/get_questline_detail.ts';
import {
	createQuestline,
	detachQuestFromQuestline,
	moveQuestToQuestline,
} from '../questlines/index.ts';
import type { CreateQuestlineInput } from '../questlines/types.ts';
import { createQuest, getQuestDetail } from '../quests/index.ts';
import type { CreateQuestInput } from '../quests/types.ts';
import { getRumorDetail } from '../rumors/get_rumor_detail.ts';
import { dismissRumor, reopenRumor, settleRumor, updateRumor } from '../rumors/index.ts';
import type { SettleRumorInput } from '../rumors/types.ts';
import { type CalendarInputs, normalizeCalendarInputs } from './calendar_inputs.ts';
import { translateToolError } from './tool_errors.ts';
import {
	arraySchema,
	booleanSchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { shapeWorkToolName } from './tool_names.ts';
import { inspectItemNext, reviewViewNext } from './tool_next.ts';
import { toQuestlineRef, toQuestRef, toRumorRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolResult } from './tool_types.ts';
import { toolNeedsClarification, toolNoOp, toolSuccess } from './tool_types.ts';

export type ShapeWorkToolInput =
	| {
			action: 'attach_quest_to_questline';
			now?: number;
			questId: number;
			questlineId: number;
	  }
	| { action: 'create_quest'; now?: number; quest: CreateQuestInput }
	| { action: 'create_questline'; now?: number; questline: CreateQuestlineInput }
	| { action: 'detach_quest_from_questline'; now?: number; questId: number }
	| { action: 'dismiss_rumor'; now?: number; dismissedAt?: number; rumorId: number }
	| { action: 'reopen_rumor'; now?: number; rumorId: number }
	| ({ action: 'settle_rumor'; now?: number; rumorId: number } & SettleRumorInput)
	| { action: 'update_rumor'; rumorId: number; title?: string; details?: string; now?: number };

export interface ShapeWorkToolData {
	action: ShapeWorkToolInput['action'];
	primary?: ToolEntityRef | undefined;
	created?: ToolEntityRef[] | undefined;
	updated?: ToolEntityRef[] | undefined;
	quest?: ReturnType<typeof getQuestDetail> | undefined;
	questline?: ReturnType<typeof getQuestlineDetail> | undefined;
	quests?: Array<ReturnType<typeof getQuestDetail>> | undefined;
	rumor?: ReturnType<typeof getRumorDetail> | undefined;
}

export type ShapeWorkToolResult = ToolResult<ShapeWorkToolData>;

export function shapeWorkToolHandler(
	db: Parameters<typeof createQuest>[0],
	rawInput: CalendarInputs<ShapeWorkToolInput>,
): ShapeWorkToolResult {
	try {
		const input = normalizeCalendarInputs(rawInput) as ShapeWorkToolInput;
		switch (input.action) {
			case 'dismiss_rumor': {
				const current = getRumorDetail(db, input.rumorId);
				if (current.state === 'dismissed') {
					return toolNoOp(
						`Rumor \`${current.title}\` is already dismissed.`,
						{
							action: input.action,
							primary: toRumorRef(current),
							rumor: current,
						},
						{
							entities: [toRumorRef(current)],
						},
					);
				}
				const rumor = dismissRumor(db, input.rumorId, input.dismissedAt ?? input.now);
				return toolSuccess(
					`Dismissed rumor \`${rumor.title}\`.`,
					{
						action: input.action,
						primary: toRumorRef(rumor),
						updated: [toRumorRef(rumor)],
						rumor: getRumorDetail(db, rumor.id),
					},
					{
						entities: [toRumorRef(rumor)],
					},
				);
			}
			case 'reopen_rumor': {
				const current = getRumorDetail(db, input.rumorId);
				if (current.state === 'open') {
					return toolNoOp(
						`Rumor \`${current.title}\` is already open.`,
						{
							action: input.action,
							primary: toRumorRef(current),
							rumor: current,
						},
						{
							entities: [toRumorRef(current)],
						},
					);
				}
				const rumor = reopenRumor(db, input.rumorId, input.now);
				const detail = getRumorDetail(db, rumor.id);
				return toolSuccess(
					`Reopened rumor \`${detail.title}\`.`,
					{
						action: input.action,
						primary: toRumorRef(detail),
						updated: [toRumorRef(detail)],
						rumor: detail,
					},
					{
						entities: [toRumorRef(detail)],
						next: [inspectItemNext(toRumorRef(detail))],
					},
				);
			}
			case 'settle_rumor': {
				if (!input.questline && (!input.quests || input.quests.length === 0)) {
					return toolNeedsClarification(
						'missing_required_choice',
						'How should this rumor be settled into real work?',
						['questline', 'quests'],
					);
				}
				const settleInput: SettleRumorInput = {
					...(input.now === undefined ? {} : { settledAt: input.now }),
				};
				if (input.questline) {
					settleInput.questline = input.questline;
				}
				if (input.quests) {
					settleInput.quests = input.quests;
				}
				if (input.settledAt != null) {
					settleInput.settledAt = input.settledAt;
				}
				const settled = settleRumor(db, input.rumorId, settleInput);
				const rumorDetail = getRumorDetail(db, settled.rumor.id);
				const createdQuestline =
					settled.questline == null ? undefined : getQuestlineDetail(db, settled.questline.id);
				const createdQuests = settled.quests.map((quest) => getQuestDetail(db, quest.id));
				return toolSuccess(
					`Settled rumor \`${rumorDetail.title}\`.`,
					{
						action: input.action,
						primary: toRumorRef(rumorDetail),
						created: [
							...(createdQuestline ? [toQuestlineRef(createdQuestline)] : []),
							...createdQuests.map(toQuestRef),
						],
						updated: [toRumorRef(rumorDetail)],
						rumor: rumorDetail,
						questline: createdQuestline,
						quests: createdQuests,
					},
					{
						entities: [
							toRumorRef(rumorDetail),
							...(createdQuestline ? [toQuestlineRef(createdQuestline)] : []),
							...createdQuests.map(toQuestRef),
						],
						next: [reviewViewNext('quests.available')],
					},
				);
			}
			case 'create_quest': {
				const quest = createQuest(db, {
					...input.quest,
					now: input.quest.now ?? input.now ?? Date.now(),
				});
				const detail = getQuestDetail(db, quest.id);
				return toolSuccess(
					`Created quest \`${detail.title}\`.`,
					{
						action: input.action,
						primary: toQuestRef(detail),
						created: [toQuestRef(detail)],
						quest: detail,
					},
					{
						entities: [toQuestRef(detail)],
						next: [inspectItemNext(toQuestRef(detail))],
					},
				);
			}
			case 'create_questline': {
				const questline = createQuestline(db, {
					...input.questline,
					now: input.questline.now ?? input.now ?? Date.now(),
				});
				const detail = getQuestlineDetail(db, questline.id);
				return toolSuccess(
					`Created questline \`${detail.title}\`.`,
					{
						action: input.action,
						primary: toQuestlineRef(detail),
						created: [toQuestlineRef(detail)],
						questline: detail,
					},
					{
						entities: [toQuestlineRef(detail)],
					},
				);
			}
			case 'attach_quest_to_questline': {
				const current = getQuestDetail(db, input.questId);
				if (current.questlineId === input.questlineId) {
					return toolNoOp(
						`Quest \`${current.title}\` is already in that questline.`,
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
				moveQuestToQuestline(db, input.questId, input.questlineId, input.now);
				const detail = getQuestDetail(db, input.questId);
				return toolSuccess(
					`Attached quest \`${detail.title}\` to questline ${input.questlineId}.`,
					{
						action: input.action,
						primary: toQuestRef(detail),
						updated: [
							toQuestRef(detail),
							toQuestlineRef(getQuestlineDetail(db, input.questlineId)),
						],
						quest: detail,
						questline: getQuestlineDetail(db, input.questlineId),
					},
					{
						entities: [toQuestRef(detail), { kind: 'questline', id: input.questlineId }],
					},
				);
			}
			case 'detach_quest_from_questline': {
				const current = getQuestDetail(db, input.questId);
				if (current.questlineId == null) {
					return toolNoOp(
						`Quest \`${current.title}\` is not attached to a questline.`,
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
				detachQuestFromQuestline(db, input.questId, input.now);
				const detail = getQuestDetail(db, input.questId);
				return toolSuccess(
					`Detached quest \`${detail.title}\` from its questline.`,
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
			case 'update_rumor': {
				updateRumor(db, input.rumorId, {
					...(input.title != null && { title: input.title }),
					...(input.details != null && { details: input.details }),
					...(input.now != null && { now: input.now }),
				});
				const detail = getRumorDetail(db, input.rumorId);
				return toolSuccess(
					`Updated rumor \`${detail.title}\`.`,
					{
						action: input.action,
						primary: toRumorRef(detail),
						updated: [toRumorRef(detail)],
						rumor: detail,
					},
					{
						entities: [toRumorRef(detail)],
						next: [inspectItemNext(toRumorRef(detail))],
					},
				);
			}
		}
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not complete shape-work action \`${rawInput.action}\`.`,
		});
	}
}

export const shapeWorkTool = defineQuestlogTool<
	CalendarInputs<ShapeWorkToolInput>,
	ShapeWorkToolResult
>({
	name: shapeWorkToolName,
	description:
		'Create a quest (with timing, tags, and objective in one call), create a questline, settle a rumor into concrete work, or manage quest-questline membership. Use create_quest for clear commitments — include tags and timing directly to avoid follow-up calls.',
	whenToUse:
		'Use this when deciding what real work exists and how it should be grouped before or around execution. Prefer a single create_quest call with all fields over separate create + plan_quest + tag_work calls.',
	whenNotToUse:
		'Do not use this for quest execution steps like starting, finishing, abandoning, or logging effort.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: true,
	targetKinds: ['quest', 'questline', 'rumor'],
	inputDescriptions: {
		action:
			'Which structure-shaping action to perform, such as settling a rumor, creating a quest, or attaching a quest to a questline.',
		rumorId: 'The rumor to dismiss, reopen, or settle when the action targets intake.',
		questline:
			'Questline creation data used when creating a questline directly or as part of rumor settlement. Include description for context.',
		quests:
			'Concrete quest creation inputs when settling a rumor into real work. Each quest supports the same fields as the quest property — include timing and tags directly.',
		settledAt: 'Optional settlement timestamp for rumor settlement.',
		quest:
			'Quest creation input when directly creating one concrete quest. Include dueAt/scheduledStartAt/scheduledEndAt as epoch milliseconds (>= 1e12), ISO datetime, YYYY-MM-DD, today, tomorrow or +Nd/+Nh, optional now or createdAt for historical creation, tags, and rewards to create a fully specified quest in one call.',
		questId: 'The concrete quest being attached to or detached from a questline.',
		questlineId: 'The questline that should receive the quest for attach actions.',
		dismissedAt: 'Optional dismissal timestamp for dismissing a rumor.',
		now: 'Optional epoch milliseconds for creation, settlement, dismissal, reopen, membership, or rumor update. Nested creation timestamps and explicit action timestamps take precedence.',
		title: 'New title for the update_rumor action.',
		details:
			'New or enriched context for the update_rumor action. Append evidence as rumors accumulate information across conversations.',
	},
	outputDescription:
		'Returns the changed or created rumor, quest, questline, or created quest set for the selected shape-work action, plus purpose-shaped primary and created or updated refs. Repeated safe actions return structured no-op results, and rumor settlement can ask for missing structure instead of failing.',
	inputSchema: objectSchema(
		{
			action: enumSchema('Action to perform.', [
				'attach_quest_to_questline',
				'create_quest',
				'create_questline',
				'detach_quest_from_questline',
				'dismiss_rumor',
				'reopen_rumor',
				'settle_rumor',
				'update_rumor',
			]),
			questId: integerSchema('Quest to attach or detach.'),
			questlineId: integerSchema('Questline that should receive the quest.'),
			quest: objectSchema(
				{
					title: stringSchema('Title for the new quest.'),
					createdAt: integerSchema(
						'Optional creation time in epoch milliseconds; takes precedence over now.',
					),
					now: integerSchema('Optional creation timestamp in epoch milliseconds.'),
					objective: stringSchema('Objective for the new quest.'),
					questlineId: integerSchema('Optional questline to place the quest in.'),
					tags: arraySchema(stringSchema('Tag name.'), 'Optional tags to apply at creation.'),
					rewards: arraySchema(
						objectSchema(
							{
								kind: stringSchema('Reward kind.'),
								name: stringSchema('Reward name.'),
							},
							['kind', 'name'],
						),
						'Optional rewards to attach at creation.',
					),
					dueAt: integerSchema('Optional latest acceptable completion timestamp.'),
					notBeforeAt: integerSchema('Optional earliest actionable timestamp.'),
					scheduledStartAt: integerSchema('Optional planned schedule window start.'),
					scheduledEndAt: integerSchema('Optional planned schedule window end.'),
					allDay: booleanSchema('Whether the scheduled window is all-day.'),
					estimateSeconds: integerSchema('Optional active-effort estimate in seconds.'),
				},
				['title', 'objective'],
			),
			questline: objectSchema(
				{
					title: stringSchema('Questline title.'),
					now: integerSchema('Optional creation timestamp in epoch milliseconds.'),
					description: stringSchema('Optional questline description.'),
				},
				['title'],
			),
			rumorId: integerSchema('Rumor to settle, dismiss, or reopen.'),
			dismissedAt: integerSchema('Optional dismissal timestamp.'),
			settledAt: integerSchema('Optional settlement timestamp.'),
			quests: arraySchema(
				objectSchema(
					{
						title: stringSchema('Title for a created quest.'),
						createdAt: integerSchema('Optional creation time in epoch milliseconds.'),
						now: integerSchema('Optional creation timestamp in epoch milliseconds.'),
						objective: stringSchema('Objective for a created quest.'),
						tags: arraySchema(stringSchema('Tag name.'), 'Optional tags to apply at creation.'),
						rewards: arraySchema(
							objectSchema(
								{
									kind: stringSchema('Reward kind.'),
									name: stringSchema('Reward name.'),
								},
								['kind', 'name'],
							),
							'Optional rewards to attach at creation.',
						),
						dueAt: integerSchema('Optional latest acceptable completion timestamp.'),
						notBeforeAt: integerSchema('Optional earliest actionable timestamp.'),
						scheduledStartAt: integerSchema('Optional planned schedule window start.'),
						scheduledEndAt: integerSchema('Optional planned schedule window end.'),
						allDay: booleanSchema('Whether the scheduled window is all-day.'),
						estimateSeconds: integerSchema('Optional active-effort estimate in seconds.'),
					},
					['title', 'objective'],
				),
				'Quests to create during rumor settlement. Include timing and tags directly.',
			),
			now: integerSchema(
				'Optional epoch milliseconds for creation, settlement, dismissal, membership, reopen, or rumor update.',
			),
			title: stringSchema('New title for the update_rumor action.'),
			details: stringSchema('New or enriched context text for the update_rumor action.'),
		},
		['action'],
		'Create quests with timing and tags, create questlines, settle rumors into work, manage quest-questline membership, or enrich open rumors with new context.',
	),
	handler: shapeWorkToolHandler,
});
