import { listQuestlines } from '../questlines/list_questlines';
import {
	listActiveQuests,
	listAvailableQuests,
	listBlockedQuests,
	listDeferredQuests,
	listDueSoonQuests,
	listInProgressQuests,
	listMissedScheduledQuests,
	listOpenQuests,
	listOverdueQuests,
	listResolvedQuests,
	listScheduledForDay,
	listScheduledNow,
} from '../quests';
import type { QuestDetail, QuestListFilters } from '../quests/types';
import { getRepeatableQuestOrThrow } from '../repeatable_quests/get_repeatable_quest_or_throw';
import { listDueRepeatableQuestAnchors } from '../repeatable_quests/list_due_repeatable_quest_anchors';
import { listRumors } from '../rumors/list_rumors';
import {
	arraySchema,
	booleanSchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata';
import { reviewQuestlogToolName } from './tool_names';
import {
	toQuestListItem,
	toQuestlineListItem,
	toRepeatableAnchorListItem,
	toRumorListItem,
} from './tool_ref';
import { summarizeCount } from './tool_summary';
import type { ToolListItem, ToolResult } from './tool_types';
import { toolFailure, toolNeedsClarification, toolSuccess, toolWarning } from './tool_types';

export type ReviewQuestlogToolView =
	| 'questlines'
	| 'quests.active'
	| 'quests.available'
	| 'quests.blocked'
	| 'quests.deferred'
	| 'quests.due_soon'
	| 'quests.in_progress'
	| 'quests.missed_scheduled'
	| 'quests.open'
	| 'quests.overdue'
	| 'quests.resolved'
	| 'quests.scheduled_for_day'
	| 'quests.scheduled_now'
	| 'repeatables.due_anchors'
	| 'rumors';

export interface ReviewQuestlogToolInput {
	view: ReviewQuestlogToolView;
	filters?: {
		questlineId?: number;
		tagNames?: string[];
		includeDeleted?: boolean;
		dayAt?: number;
	};
	now?: number;
}

export interface ReviewQuestlogToolData {
	view: ReviewQuestlogToolView;
	items: ToolListItem[];
	count: number;
	appliedFilters: ReviewQuestlogToolInput['filters'] | undefined;
	evaluatedAt: number;
}

export type ReviewQuestlogToolResult = ToolResult<ReviewQuestlogToolData>;

function hasQuestFilters(filters: ReviewQuestlogToolInput['filters']): boolean {
	return Boolean(
		filters?.questlineId != null ||
			(filters?.tagNames && filters.tagNames.length > 0) ||
			filters?.includeDeleted,
	);
}

function utcDayBounds(dayAt: number): { start: number; end: number } {
	const date = new Date(dayAt);
	const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	return { start, end: start + 24 * 60 * 60 * 1000 };
}

function validateReviewInput(input: ReviewQuestlogToolInput): ReviewQuestlogToolResult | null {
	if (input.view === 'quests.scheduled_for_day') {
		if (input.filters?.dayAt == null) {
			return toolNeedsClarification(
				'missing_required_choice',
				'Which day should be reviewed for the scheduled-for-day view?',
				['filters.dayAt'],
			);
		}
		return null;
	}

	if (input.filters?.dayAt != null) {
		return toolFailure(
			'protocol',
			'invalid_input',
			'The `dayAt` filter is only valid for the scheduled-for-day view.',
			'Use `filters.dayAt` only with `view: "quests.scheduled_for_day"`.',
		);
	}

	if ((input.view === 'rumors' || input.view === 'questlines') && hasQuestFilters(input.filters)) {
		return toolFailure(
			'protocol',
			'invalid_input',
			'Quest filters are not valid for this review view.',
			'Use quest filters only with quest list views.',
		);
	}

	if (
		input.view === 'repeatables.due_anchors' &&
		(hasQuestFilters(input.filters) || input.filters?.dayAt != null)
	) {
		return toolFailure(
			'protocol',
			'invalid_input',
			'Filters are not supported for the due repeatable anchors view.',
			'Call the due repeatable anchors view without quest filters.',
		);
	}

	return null;
}

function questFilters(input: ReviewQuestlogToolInput): QuestListFilters {
	const filters: QuestListFilters = {};
	if (input.filters?.questlineId != null) {
		filters.questlineId = input.filters.questlineId;
	}
	if (input.filters?.tagNames && input.filters.tagNames.length > 0) {
		filters.tagNames = input.filters.tagNames;
	}
	if (input.filters?.includeDeleted) {
		filters.includeDeleted = input.filters.includeDeleted;
	}
	return filters;
}

function listQuestItems(
	view: ReviewQuestlogToolView,
	db: Parameters<typeof listOpenQuests>[0],
	filters: QuestListFilters,
	now: number,
	dayAt?: number,
): QuestDetail[] {
	switch (view) {
		case 'quests.open':
			return listOpenQuests(db, filters, now);
		case 'quests.active':
			return listActiveQuests(db, filters, now);
		case 'quests.in_progress':
			return listInProgressQuests(db, filters, now);
		case 'quests.available':
			return listAvailableQuests(db, filters, now);
		case 'quests.blocked':
			return listBlockedQuests(db, filters, now);
		case 'quests.deferred':
			return listDeferredQuests(db, filters, now);
		case 'quests.due_soon':
			return listDueSoonQuests(db, 7 * 24 * 60 * 60 * 1000, filters, now);
		case 'quests.overdue':
			return listOverdueQuests(db, filters, now);
		case 'quests.scheduled_now':
			return listScheduledNow(db, filters, now);
		case 'quests.missed_scheduled':
			return listMissedScheduledQuests(db, filters, now);
		case 'quests.resolved':
			return listResolvedQuests(db, filters, now);
		case 'quests.scheduled_for_day': {
			const bounds = utcDayBounds(dayAt ?? now);
			return listScheduledForDay(db, bounds.start, bounds.end, filters, now);
		}
		default:
			return [];
	}
}

export function reviewQuestlogToolHandler(
	db: Parameters<typeof listRumors>[0],
	input: ReviewQuestlogToolInput,
): ReviewQuestlogToolResult {
	const invalid = validateReviewInput(input);
	if (invalid) {
		return invalid;
	}

	const now = input.now ?? Date.now();
	let items: ToolListItem[] = [];

	switch (input.view) {
		case 'rumors':
			items = listRumors(db).map(toRumorListItem);
			break;
		case 'questlines':
			items = listQuestlines(db, now).map(toQuestlineListItem);
			break;
		case 'repeatables.due_anchors':
			items = listDueRepeatableQuestAnchors(db, now).map((anchor) =>
				toRepeatableAnchorListItem(anchor, getRepeatableQuestOrThrow(db, anchor.repeatableQuestId)),
			);
			break;
		default:
			items = listQuestItems(input.view, db, questFilters(input), now, input.filters?.dayAt).map(
				toQuestListItem,
			);
			break;
	}

	return toolSuccess(
		items.length === 0
			? `No items are currently in the \`${input.view}\` view.`
			: summarizeCount(items.length, 'item'),
		{
			view: input.view,
			items,
			count: items.length,
			appliedFilters: input.filters,
			evaluatedAt: now,
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
					? [toolWarning('empty_result', 'This review view is currently empty.')]
					: undefined,
		},
	);
}

export const reviewQuestlogTool = defineQuestlogTool<
	ReviewQuestlogToolInput,
	ReviewQuestlogToolResult
>({
	name: reviewQuestlogToolName,
	description:
		'Review one operational questlog surface such as available quests, open rumors, blocked work, or due repeatable anchors.',
	whenToUse:
		'Use this when you want a dashboard-style list view instead of inspecting one specific item.',
	whenNotToUse:
		'Do not use this when you already know the exact item you want to inspect in depth.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: true,
	targetKinds: ['quest', 'questline', 'repeatable_quest', 'rumor'],
	inputDescriptions: {
		view: 'Which operational read surface to return, such as available quests, open rumors, or due repeatable anchors.',
		filters:
			'Optional quest-list filters. Questline, tag, and deleted filters apply only to quest views. `dayAt` applies only to the scheduled-for-day view.',
		now: 'Optional evaluation timestamp used for time-sensitive views like availability, overdue status, and due repeatable anchors.',
	},
	outputDescription:
		'Returns compact list items for the chosen view, the item count, the applied filters, and the evaluation timestamp. Empty views return a structured success result, and the scheduled-for-day view can ask for a missing day instead of failing.',
	inputSchema: objectSchema(
		{
			view: enumSchema('Which operational review surface to return.', [
				'questlines',
				'quests.active',
				'quests.available',
				'quests.blocked',
				'quests.deferred',
				'quests.due_soon',
				'quests.in_progress',
				'quests.missed_scheduled',
				'quests.open',
				'quests.overdue',
				'quests.resolved',
				'quests.scheduled_for_day',
				'quests.scheduled_now',
				'repeatables.due_anchors',
				'rumors',
			]),
			filters: objectSchema(
				{
					questlineId: integerSchema('Optional questline id used by quest views.'),
					tagNames: arraySchema(
						stringSchema('Tag name.'),
						'Optional tag names used by quest views.',
					),
					includeDeleted: booleanSchema(
						'Whether deleted quests should be included in quest views.',
					),
					dayAt: integerSchema('UTC timestamp within the day to review for scheduled-for-day.'),
				},
				[],
				'Optional filters for supported review surfaces.',
			),
			now: integerSchema('Optional evaluation timestamp for time-sensitive views.'),
		},
		['view'],
		'Review one questlog surface.',
	),
	handler: reviewQuestlogToolHandler,
});
