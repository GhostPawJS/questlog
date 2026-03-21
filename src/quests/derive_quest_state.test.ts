import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveQuestState } from './derive_quest_state';
import type { Quest } from './types';

function q(partial: Partial<Quest> & Pick<Quest, 'id'>): Quest {
	return {
		id: partial.id,
		questlineId: partial.questlineId ?? null,
		sourceRumorId: partial.sourceRumorId ?? null,
		spawnedByQuestId: partial.spawnedByQuestId ?? null,
		spawnedFromRepeatableId: partial.spawnedFromRepeatableId ?? null,
		spawnedForAt: partial.spawnedForAt ?? null,
		title: partial.title ?? 't',
		objective: partial.objective ?? 'o',
		outcome: partial.outcome ?? null,
		createdAt: partial.createdAt ?? 1,
		updatedAt: partial.updatedAt ?? 1,
		startedAt: partial.startedAt ?? null,
		resolvedAt: partial.resolvedAt ?? null,
		success: partial.success ?? null,
		effortSeconds: partial.effortSeconds ?? 0,
		estimateSeconds: partial.estimateSeconds ?? null,
		notBeforeAt: partial.notBeforeAt ?? null,
		dueAt: partial.dueAt ?? null,
		scheduledStartAt: partial.scheduledStartAt ?? null,
		scheduledEndAt: partial.scheduledEndAt ?? null,
		allDay: partial.allDay ?? false,
		deletedAt: partial.deletedAt ?? null,
	};
}

describe('deriveQuestState', () => {
	it('returns open when unresolved and not started', () => {
		strictEqual(
			deriveQuestState(q({ id: 1, resolvedAt: null, startedAt: null, success: null })),
			'open',
		);
	});

	it('returns in_progress when started and unresolved', () => {
		strictEqual(
			deriveQuestState(q({ id: 1, resolvedAt: null, startedAt: 5, success: null })),
			'in_progress',
		);
	});

	it('returns done only when resolved with success true', () => {
		strictEqual(
			deriveQuestState(q({ id: 1, resolvedAt: 10, startedAt: 5, success: true })),
			'done',
		);
	});

	it('returns abandoned when resolved with success false', () => {
		strictEqual(
			deriveQuestState(q({ id: 1, resolvedAt: 10, startedAt: 5, success: false })),
			'abandoned',
		);
	});
});
