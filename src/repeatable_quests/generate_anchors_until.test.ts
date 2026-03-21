import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { generateAnchorsUntil } from './generate_anchors_until.ts';
import type { RepeatableQuest } from './types.ts';

function rq(
	partial: Partial<RepeatableQuest> & Pick<RepeatableQuest, 'anchorAt' | 'rrule'>,
): RepeatableQuest {
	return {
		id: partial.id ?? 1,
		questlineId: partial.questlineId ?? null,
		title: partial.title ?? 't',
		objective: partial.objective ?? 'o',
		rrule: partial.rrule,
		anchorAt: partial.anchorAt,
		notBeforeOffsetSeconds: partial.notBeforeOffsetSeconds ?? null,
		dueOffsetSeconds: partial.dueOffsetSeconds ?? null,
		scheduledStartOffsetSeconds: partial.scheduledStartOffsetSeconds ?? null,
		scheduledEndOffsetSeconds: partial.scheduledEndOffsetSeconds ?? null,
		allDay: partial.allDay ?? false,
		estimateSeconds: partial.estimateSeconds ?? null,
		createdAt: partial.createdAt ?? 1,
		updatedAt: partial.updatedAt ?? 1,
		archivedAt: partial.archivedAt ?? null,
		deletedAt: partial.deletedAt ?? null,
	};
}

describe('generateAnchorsUntil', () => {
	it('returns no anchors when anchor is already past the effective horizon', () => {
		const g = generateAnchorsUntil(rq({ rrule: 'FREQ=DAILY', anchorAt: 10_000 }), 5_000);
		strictEqual(g.length, 0);
	});

	it('enumerates DAILY anchors with interval in day-sized steps', () => {
		const start = Date.UTC(2024, 0, 1, 12, 0, 0);
		const anchors = generateAnchorsUntil(
			rq({ rrule: 'FREQ=DAILY;INTERVAL=1', anchorAt: start }),
			start + 2 * 86_400_000,
		);
		strictEqual(anchors.length, 3);
		strictEqual(anchors[0], start);
		strictEqual(anchors[1], start + 86_400_000);
	});
});
