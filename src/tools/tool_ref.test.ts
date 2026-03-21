import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	toQuestListItem,
	toQuestlineListItem,
	toQuestlineRef,
	toQuestRef,
	toRepeatableAnchorListItem,
	toRepeatableQuestListItem,
	toRepeatableQuestRef,
	toRewardRef,
	toRumorListItem,
	toRumorRef,
	toSearchListItem,
} from './tool_ref.ts';

describe('tool_ref mappers', () => {
	it('derives quest refs from raw quest state and builds quest list items', () => {
		const rawQuest = {
			id: 1,
			title: 'Draft memo',
			startedAt: null,
			resolvedAt: null,
			success: null,
		} as Parameters<typeof toQuestRef>[0];
		const detailQuest = {
			id: 2,
			title: 'Approve memo',
			markerId: 'attention.available',
			state: 'open',
			objective: 'Review it.',
			effectiveDueAt: 25,
			available: true,
		} as Parameters<typeof toQuestListItem>[0];

		deepStrictEqual(toQuestRef(rawQuest), {
			kind: 'quest',
			id: 1,
			title: 'Draft memo',
			markerId: null,
			state: 'open',
		});
		deepStrictEqual(toQuestListItem(detailQuest), {
			kind: 'quest',
			id: 2,
			title: 'Approve memo',
			markerId: 'attention.available',
			state: 'open',
			subtitle: 'Review it.',
			dueAt: 25,
			available: true,
		});
	});

	it('maps questline and repeatable refs and list items', () => {
		const questline = {
			id: 4,
			title: 'Launch',
			archivedAt: null,
			description: 'Everything for launch.',
			dueAt: 100,
			availableQuests: 2,
		} as Parameters<typeof toQuestlineListItem>[0];
		const repeatable = {
			id: 5,
			title: 'Weekly review',
			objective: 'Review the week.',
			anchorAt: 200,
			archivedAt: 300,
		} as Parameters<typeof toRepeatableQuestListItem>[0];

		strictEqual(toQuestlineRef(questline).state, 'active');
		strictEqual(toRepeatableQuestRef(repeatable).state, 'archived');
		deepStrictEqual(toQuestlineListItem(questline), {
			kind: 'questline',
			id: 4,
			title: 'Launch',
			state: 'active',
			subtitle: 'Everything for launch.',
			dueAt: 100,
			available: true,
		});
		deepStrictEqual(toRepeatableQuestListItem(repeatable), {
			kind: 'repeatable_quest',
			id: 5,
			title: 'Weekly review',
			state: 'archived',
			subtitle: 'Review the week.',
			dueAt: 200,
		});
		deepStrictEqual(
			toRepeatableAnchorListItem(
				{ repeatableQuestId: 5, anchorAt: 250, markerId: 'attention.available' },
				repeatable,
			),
			{
				kind: 'repeatable_quest',
				id: 5,
				title: 'Weekly review',
				markerId: 'attention.available',
				state: 'archived',
				dueAt: 250,
				subtitle: 'Review the week.',
			},
		);
	});

	it('derives rumor and reward refs and maps search items', () => {
		const rumor = {
			id: 8,
			title: 'Vendor terms changed',
			markerId: 'attention.available',
			dismissedAt: null,
			settledAt: 20,
			details: 'Legal flagged updates.',
		} as Parameters<typeof toRumorListItem>[0];
		const reward = {
			id: 11,
			name: 'Launch XP',
			claimedAt: 30,
		} as Parameters<typeof toRewardRef>[0];

		deepStrictEqual(toRumorRef(rumor), {
			kind: 'rumor',
			id: 8,
			title: 'Vendor terms changed',
			markerId: 'attention.available',
			state: 'settled',
		});
		deepStrictEqual(toRumorListItem(rumor), {
			kind: 'rumor',
			id: 8,
			title: 'Vendor terms changed',
			markerId: 'attention.available',
			state: 'settled',
			subtitle: 'Legal flagged updates.',
		});
		deepStrictEqual(toRewardRef(reward), {
			kind: 'reward',
			id: 11,
			title: 'Launch XP',
			state: 'claimed',
		});
		deepStrictEqual(
			toSearchListItem({
				entityKind: 'rumor',
				entityId: 8,
				title: 'Vendor terms changed',
				markerId: 'attention.available',
				snippet: 'Legal flagged updates.',
			}),
			{
				kind: 'rumor',
				id: 8,
				title: 'Vendor terms changed',
				markerId: 'attention.available',
				snippet: 'Legal flagged updates.',
			},
		);
	});
});
