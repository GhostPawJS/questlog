import { assertActiveRowExists } from '../assert_active_row_exists.ts';
import type { QuestlogDb } from '../database.ts';
import { getQuestRewardOrThrow } from '../rewards/get_quest_reward_or_throw.ts';
import {
	addQuestReward,
	claimQuestReward,
	removeQuestReward,
	replaceRepeatableQuestRewards,
	updateQuestReward,
} from '../rewards/index.ts';
import type { QuestRewardInput, RepeatableQuestRewardInput } from '../rewards/types.ts';
import { translateToolError } from './tool_errors.ts';
import {
	arraySchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { rewardWorkToolName } from './tool_names.ts';
import { toRewardRef } from './tool_ref.ts';
import type { ToolResult } from './tool_types.ts';
import { toolNoOp, toolSuccess, toolWarning } from './tool_types.ts';

export type RewardWorkToolInput =
	| { action: 'add'; reward: QuestRewardInput; target: { id: number; kind: 'quest' } }
	| { action: 'claim'; claimedAt?: number; target: { id: number; kind: 'reward' } }
	| { action: 'remove'; now?: number; target: { id: number; kind: 'reward' } }
	| {
			action: 'replace_repeatable_template';
			now?: number;
			rewards: RepeatableQuestRewardInput[];
			target: { id: number; kind: 'repeatable_quest' };
	  }
	| {
			action: 'update';
			reward: Omit<QuestRewardInput, 'now'> & { now?: number };
			target: { id: number; kind: 'reward' };
	  };

export interface RewardWorkToolData {
	action: RewardWorkToolInput['action'];
	reward?: ReturnType<typeof getQuestRewardOrThrow> | undefined;
	rewards?: Array<ReturnType<typeof getQuestRewardOrThrow>> | undefined;
	target: RewardWorkToolInput['target'];
}

export type RewardWorkToolResult = ToolResult<RewardWorkToolData>;

export function rewardWorkToolHandler(
	db: QuestlogDb,
	input: RewardWorkToolInput,
): RewardWorkToolResult {
	try {
		switch (input.action) {
			case 'add': {
				const reward = addQuestReward(db, input.target.id, input.reward);
				return toolSuccess(
					'Added quest reward.',
					{
						action: input.action,
						target: input.target,
						reward,
					},
					{
						entities: [{ kind: 'quest', id: input.target.id }, toRewardRef(reward)],
					},
				);
			}
			case 'update': {
				const reward = updateQuestReward(db, input.target.id, input.reward);
				return toolSuccess(
					'Updated quest reward.',
					{
						action: input.action,
						target: input.target,
						reward,
					},
					{
						entities: [toRewardRef(reward)],
					},
				);
			}
			case 'remove': {
				const current = getQuestRewardOrThrow(db, input.target.id);
				if (current.claimedAt != null) {
					return translateToolError(new Error('Claimed rewards cannot be removed.'), {
						summary: 'Could not remove the claimed reward.',
						entities: [toRewardRef(current)],
					});
				}
				removeQuestReward(db, input.target.id, input.now);
				return toolSuccess(
					'Removed quest reward.',
					{
						action: input.action,
						target: input.target,
					},
					{
						entities: [toRewardRef(current)],
					},
				);
			}
			case 'claim': {
				const current = getQuestRewardOrThrow(db, input.target.id);
				if (current.claimedAt != null) {
					return toolNoOp(
						`Reward \`${current.name}\` is already claimed.`,
						{
							action: input.action,
							target: input.target,
							reward: current,
						},
						{
							entities: [toRewardRef(current)],
						},
					);
				}
				const reward = claimQuestReward(db, input.target.id, input.claimedAt);
				return toolSuccess(
					'Claimed quest reward.',
					{
						action: input.action,
						target: input.target,
						reward,
					},
					{
						entities: [toRewardRef(reward)],
					},
				);
			}
			case 'replace_repeatable_template': {
				assertActiveRowExists(db, 'repeatable_quests', input.target.id, 'Repeatable quest');
				replaceRepeatableQuestRewards(db, input.target.id, input.rewards, input.now);
				return toolSuccess(
					'Replaced repeatable quest future reward templates.',
					{
						action: input.action,
						target: input.target,
					},
					{
						entities: [{ kind: 'repeatable_quest', id: input.target.id }],
						warnings: [
							toolWarning(
								'future_only_effect',
								'This change only affects future spawned quests, not historical spawned rewards.',
							),
						],
					},
				);
			}
		}
	} catch (error) {
		return translateToolError(error, {
			summary: `Could not complete reward-work action \`${input.action}\`.`,
		});
	}
}

export const rewardWorkTool = defineQuestlogTool<RewardWorkToolInput, RewardWorkToolResult>({
	name: rewardWorkToolName,
	description:
		'Manage rewards by adding, updating, removing, or claiming quest rewards, or by replacing future reward templates on repeatable quests.',
	whenToUse:
		'Use this when a completed or recurring piece of work should grant or update reward information.',
	whenNotToUse:
		'Do not use this to finish quests themselves or to model dependencies, classification, or scheduling.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['quest', 'reward', 'repeatable_quest'],
	inputDescriptions: {
		action: 'Which reward action to perform on the selected target.',
		target: 'The quest, reward, or repeatable quest that the reward action applies to.',
		reward: 'Reward fields used when adding or updating one concrete quest reward.',
		rewards: 'The full future reward template set for a repeatable quest.',
		claimedAt: 'Optional timestamp for claiming a reward.',
		now: 'Optional timestamp for removing a reward or replacing repeatable reward templates.',
	},
	outputDescription:
		'Returns the updated or claimed reward when one concrete reward changes, or a structured success result for repeatable future template replacement. Already-claimed rewards return a structured no-op for claim and an error for invalid update or remove attempts.',
	inputSchema: {
		oneOf: [
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['add']),
					reward: objectSchema(
						{
							kind: stringSchema('Reward kind.'),
							name: stringSchema('Reward name.'),
						},
						['kind', 'name'],
					),
					target: objectSchema(
						{
							id: integerSchema('Quest id.'),
							kind: enumSchema('Target kind.', ['quest']),
						},
						['id', 'kind'],
					),
				},
				['action', 'reward', 'target'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['claim']),
					claimedAt: integerSchema('Optional claim timestamp.'),
					target: objectSchema(
						{
							id: integerSchema('Reward id.'),
							kind: enumSchema('Target kind.', ['reward']),
						},
						['id', 'kind'],
					),
				},
				['action', 'target'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['remove']),
					now: integerSchema('Optional removal timestamp.'),
					target: objectSchema(
						{
							id: integerSchema('Reward id.'),
							kind: enumSchema('Target kind.', ['reward']),
						},
						['id', 'kind'],
					),
				},
				['action', 'target'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['replace_repeatable_template']),
					now: integerSchema('Optional timestamp for replacing templates.'),
					rewards: arraySchema(
						objectSchema(
							{
								kind: stringSchema('Reward kind.'),
								name: stringSchema('Reward name.'),
							},
							['kind', 'name'],
						),
						'Full future reward template set.',
					),
					target: objectSchema(
						{
							id: integerSchema('Repeatable quest id.'),
							kind: enumSchema('Target kind.', ['repeatable_quest']),
						},
						['id', 'kind'],
					),
				},
				['action', 'target', 'rewards'],
			),
			objectSchema(
				{
					action: enumSchema('Action to perform.', ['update']),
					reward: objectSchema(
						{
							kind: stringSchema('Optional reward kind.'),
							name: stringSchema('Optional reward name.'),
							now: integerSchema('Optional update timestamp.'),
						},
						[],
					),
					target: objectSchema(
						{
							id: integerSchema('Reward id.'),
							kind: enumSchema('Target kind.', ['reward']),
						},
						['id', 'kind'],
					),
				},
				['action', 'target', 'reward'],
			),
		],
		description: 'Manage quest rewards and repeatable reward templates.',
	},
	handler: rewardWorkToolHandler,
});
