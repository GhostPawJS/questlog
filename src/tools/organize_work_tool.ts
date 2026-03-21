import { archiveQuestline, getQuestlineDetail, updateQuestline } from '../questlines';
import type { UpdateQuestlineInput } from '../questlines/types';
import { getQuestDetail } from '../quests/get_quest_detail';
import { addUnlock, removeUnlock, replaceUnlocks } from '../unlocks';
import { translateToolError } from './tool_errors';
import {
	arraySchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata';
import { organizeWorkToolName } from './tool_names';
import { toQuestlineRef, toQuestRef } from './tool_ref';
import type { ToolResult } from './tool_types';
import { toolNoOp, toolSuccess } from './tool_types';

export type OrganizeWorkToolInput =
	| { action: 'add_unlock'; fromQuestId: number; now?: number; toQuestId: number }
	| { action: 'archive_questline'; archivedAt?: number; questlineId: number }
	| { action: 'remove_unlock'; fromQuestId: number; now?: number; toQuestId: number }
	| { action: 'replace_unlocks'; fromQuestIds: number[]; now?: number; toQuestId: number }
	| ({ action: 'set_questline_fields'; questlineId: number } & UpdateQuestlineInput);

export interface OrganizeWorkToolData {
	action: OrganizeWorkToolInput['action'];
	quest?: ReturnType<typeof getQuestDetail>;
	questline?: ReturnType<typeof getQuestlineDetail>;
}

export type OrganizeWorkToolResult = ToolResult<OrganizeWorkToolData>;

function sameQuestlineFields(
	current: ReturnType<typeof getQuestlineDetail>,
	input: UpdateQuestlineInput,
): boolean {
	return (
		(input.title === undefined || input.title === current.title) &&
		(input.description === undefined || input.description === current.description) &&
		(input.startsAt === undefined || input.startsAt === current.startsAt) &&
		(input.dueAt === undefined || input.dueAt === current.dueAt) &&
		(input.archivedAt === undefined || input.archivedAt === current.archivedAt)
	);
}

export function organizeWorkToolHandler(
	db: Parameters<typeof getQuestlineDetail>[0],
	input: OrganizeWorkToolInput,
): OrganizeWorkToolResult {
	try {
		switch (input.action) {
			case 'set_questline_fields': {
				const current = getQuestlineDetail(db, input.questlineId);
				if (sameQuestlineFields(current, input)) {
					return toolNoOp(
						`Questline \`${current.title}\` already has those fields.`,
						{
							action: input.action,
							questline: current,
						},
						{
							entities: [toQuestlineRef(current)],
						},
					);
				}
				updateQuestline(db, input.questlineId, input);
				const detail = getQuestlineDetail(db, input.questlineId);
				return toolSuccess(
					`Updated questline \`${detail.title}\`.`,
					{
						action: input.action,
						questline: detail,
					},
					{
						entities: [toQuestlineRef(detail)],
					},
				);
			}
			case 'archive_questline': {
				const current = getQuestlineDetail(db, input.questlineId);
				if (current.archivedAt != null) {
					return toolNoOp(
						`Questline \`${current.title}\` is already archived.`,
						{
							action: input.action,
							questline: current,
						},
						{
							entities: [toQuestlineRef(current)],
						},
					);
				}
				archiveQuestline(db, input.questlineId, input.archivedAt);
				const detail = getQuestlineDetail(db, input.questlineId);
				return toolSuccess(
					`Archived questline \`${detail.title}\`.`,
					{
						action: input.action,
						questline: detail,
					},
					{
						entities: [toQuestlineRef(detail)],
					},
				);
			}
			case 'add_unlock': {
				const current = getQuestDetail(db, input.toQuestId);
				if (current.unlockedByQuestIds.includes(input.fromQuestId)) {
					return toolNoOp(
						`Quest \`${current.title}\` is already blocked by that prerequisite.`,
						{
							action: input.action,
							quest: current,
						},
						{
							entities: [toQuestRef(current)],
						},
					);
				}
				addUnlock(db, input.fromQuestId, input.toQuestId, input.now);
				const detail = getQuestDetail(db, input.toQuestId);
				return toolSuccess(
					`Added an unlock prerequisite to quest \`${detail.title}\`.`,
					{
						action: input.action,
						quest: detail,
					},
					{
						entities: [toQuestRef(detail), { kind: 'quest', id: input.fromQuestId }],
					},
				);
			}
			case 'remove_unlock': {
				const current = getQuestDetail(db, input.toQuestId);
				if (!current.unlockedByQuestIds.includes(input.fromQuestId)) {
					return toolNoOp(
						`Quest \`${current.title}\` is not blocked by that prerequisite.`,
						{
							action: input.action,
							quest: current,
						},
						{
							entities: [toQuestRef(current)],
						},
					);
				}
				removeUnlock(db, input.fromQuestId, input.toQuestId, input.now);
				const detail = getQuestDetail(db, input.toQuestId);
				return toolSuccess(
					`Removed an unlock prerequisite from quest \`${detail.title}\`.`,
					{
						action: input.action,
						quest: detail,
					},
					{
						entities: [toQuestRef(detail), { kind: 'quest', id: input.fromQuestId }],
					},
				);
			}
			case 'replace_unlocks': {
				const current = getQuestDetail(db, input.toQuestId);
				const currentIds = [...current.unlockedByQuestIds].sort((a, b) => a - b);
				const nextIds = [...new Set(input.fromQuestIds)].sort((a, b) => a - b);
				if (
					currentIds.length === nextIds.length &&
					currentIds.every((value, index) => value === nextIds[index])
				) {
					return toolNoOp(
						`Quest \`${current.title}\` already has that blocker set.`,
						{
							action: input.action,
							quest: current,
						},
						{
							entities: [toQuestRef(current)],
						},
					);
				}
				replaceUnlocks(db, input.toQuestId, input.fromQuestIds, input.now);
				const detail = getQuestDetail(db, input.toQuestId);
				return toolSuccess(
					`Replaced the blocker set for quest \`${detail.title}\`.`,
					{
						action: input.action,
						quest: detail,
					},
					{
						entities: [
							toQuestRef(detail),
							...nextIds.map((id) => ({ kind: 'quest' as const, id })),
						],
					},
				);
			}
		}
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not complete organize-work action \`${input.action}\`.`,
		});
	}
}

export const organizeWorkTool = defineQuestlogTool<OrganizeWorkToolInput, OrganizeWorkToolResult>({
	name: organizeWorkToolName,
	description:
		'Organize grouping and dependency structure by updating questlines or changing hard unlock prerequisites between concrete quests.',
	whenToUse:
		'Use this when work structure or gating logic should change without changing quest execution state.',
	whenNotToUse:
		'Do not use this for quest execution, planning-only edits, intake capture, or tag-like classification.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['quest', 'questline'],
	inputDescriptions: {
		action: 'Which structural organization action to perform.',
		questlineId: 'The questline to update or archive.',
		title: 'Optional new questline title for field updates.',
		description: 'Optional new questline description for field updates.',
		startsAt: 'Optional questline start timestamp for field updates.',
		dueAt: 'Optional questline due timestamp for field updates.',
		archivedAt: 'Optional archive timestamp for archiving a questline.',
		toQuestId: 'The quest whose incoming blocker set should change.',
		fromQuestId: 'The prerequisite quest for add-unlock or remove-unlock actions.',
		fromQuestIds: 'The full prerequisite quest id set for the replace-unlocks action.',
		now: 'Optional timestamp for unlock changes.',
	},
	outputDescription:
		'Returns the updated questline detail or target quest detail after grouping or dependency changes. Repeated equivalent changes return structured no-op results.',
	inputSchema: {
		oneOf: [
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['add_unlock']),
					fromQuestId: integerSchema('Prerequisite quest id.'),
					now: integerSchema('Optional timestamp for the unlock change.'),
					toQuestId: integerSchema('Quest whose blockers should change.'),
				},
				['action', 'fromQuestId', 'toQuestId'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['archive_questline']),
					archivedAt: integerSchema('Optional archive timestamp.'),
					questlineId: integerSchema('Questline to archive.'),
				},
				['action', 'questlineId'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['remove_unlock']),
					fromQuestId: integerSchema('Prerequisite quest id.'),
					now: integerSchema('Optional timestamp for the unlock change.'),
					toQuestId: integerSchema('Quest whose blockers should change.'),
				},
				['action', 'fromQuestId', 'toQuestId'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['replace_unlocks']),
					fromQuestIds: arraySchema(integerSchema('Quest id.'), 'Full prerequisite quest id set.'),
					now: integerSchema('Optional timestamp for the unlock change.'),
					toQuestId: integerSchema('Quest whose blockers should change.'),
				},
				['action', 'fromQuestIds', 'toQuestId'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['set_questline_fields']),
					questlineId: integerSchema('Questline to update.'),
					title: stringSchema('Optional new questline title.'),
					description: stringSchema('Optional new questline description.'),
					startsAt: integerSchema('Optional questline start timestamp.'),
					dueAt: integerSchema('Optional questline due timestamp.'),
					archivedAt: integerSchema('Optional archive timestamp.'),
					now: integerSchema('Optional update timestamp.'),
				},
				['action', 'questlineId'],
			),
		],
		description: 'Organize questline fields and unlock dependencies.',
	},
	handler: organizeWorkToolHandler,
});
