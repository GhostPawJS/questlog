import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveQuestMarkerId } from './derive_quest_marker_id.ts';

describe('deriveQuestMarkerId', () => {
	it('returns yellow available attention for open quests that are available now', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'open',
				available: true,
				hasUnclaimedReward: false,
				notBeforeAt: null,
				blockerCount: 0,
				now: 100,
			}),
			'attention.available',
		);
	});

	it('returns gray future attention for open quests deferred by not-before', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'open',
				available: false,
				hasUnclaimedReward: false,
				notBeforeAt: 200,
				blockerCount: 0,
				now: 100,
			}),
			'attention.available.future',
		);
	});

	it('prefers the future attention marker over blocked progress when both apply', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'open',
				available: false,
				hasUnclaimedReward: false,
				notBeforeAt: 200,
				blockerCount: 2,
				now: 100,
			}),
			'attention.available.future',
		);
	});

	it('returns gray incomplete progress for blocked open quests', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'open',
				available: false,
				hasUnclaimedReward: false,
				notBeforeAt: null,
				blockerCount: 1,
				now: 100,
			}),
			'progress.incomplete',
		);
	});

	it('returns gray incomplete progress for quests already in progress', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'in_progress',
				available: false,
				hasUnclaimedReward: false,
				notBeforeAt: null,
				blockerCount: 0,
				now: 100,
			}),
			'progress.incomplete',
		);
	});

	it('returns yellow complete progress for done quests with unclaimed rewards', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'done',
				available: false,
				hasUnclaimedReward: true,
				notBeforeAt: null,
				blockerCount: 0,
				now: 100,
			}),
			'progress.complete',
		);
	});

	it('returns null for abandoned quests', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'abandoned',
				available: false,
				hasUnclaimedReward: false,
				notBeforeAt: null,
				blockerCount: 0,
				now: 100,
			}),
			null,
		);
	});

	it('returns null for open quests with no exact marker semantics', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'open',
				available: false,
				hasUnclaimedReward: false,
				notBeforeAt: null,
				blockerCount: 0,
				now: 100,
			}),
			null,
		);
	});

	it('returns null for done quests with no unclaimed rewards', () => {
		strictEqual(
			deriveQuestMarkerId({
				state: 'done',
				available: false,
				hasUnclaimedReward: false,
				notBeforeAt: null,
				blockerCount: 0,
				now: 100,
			}),
			null,
		);
	});
});
