import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deriveRumorState } from './derive_rumor_state.ts';
import type { Rumor } from './types.ts';

function r(partial: Partial<Rumor> & Pick<Rumor, 'id'>): Rumor {
	return {
		id: partial.id,
		title: partial.title ?? 't',
		details: partial.details ?? null,
		markerId: partial.markerId ?? null,
		createdAt: partial.createdAt ?? 1,
		updatedAt: partial.updatedAt ?? 1,
		dismissedAt: partial.dismissedAt ?? null,
		settledAt: partial.settledAt ?? null,
		deletedAt: partial.deletedAt ?? null,
	};
}

describe('deriveRumorState', () => {
	it('prefers dismissed over settled', () => {
		strictEqual(deriveRumorState(r({ id: 1, dismissedAt: 2, settledAt: 3 })), 'dismissed');
	});

	it('returns settled when not dismissed', () => {
		strictEqual(deriveRumorState(r({ id: 1, dismissedAt: null, settledAt: 3 })), 'settled');
	});

	it('returns open otherwise', () => {
		strictEqual(deriveRumorState(r({ id: 1, dismissedAt: null, settledAt: null })), 'open');
	});
});
