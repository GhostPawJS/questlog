import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	summarizeCount,
	summarizeCreated,
	summarizeHidden,
	summarizeNoOp,
	summarizeUpdated,
} from './tool_summary.ts';

describe('tool_summary helpers', () => {
	it('pluralizes count summaries correctly', () => {
		strictEqual(summarizeCount(1, 'match'), 'Found 1 match.');
		strictEqual(summarizeCount(2, 'match'), 'Found 2 matchs.');
		strictEqual(summarizeCount(3, 'match', 'matches'), 'Found 3 matches.');
	});

	it('formats created, updated, hidden, and no-op summaries', () => {
		strictEqual(summarizeCreated('quest', 'Draft memo'), 'Created quest `Draft memo`.');
		strictEqual(summarizeCreated('quest'), 'Created quest.');
		strictEqual(summarizeUpdated('questline', 'Launch'), 'Updated questline `Launch`.');
		strictEqual(summarizeUpdated('questline'), 'Updated questline.');
		strictEqual(summarizeHidden('rumor', 'Old lead'), 'Hid rumor `Old lead`.');
		strictEqual(summarizeHidden('rumor'), 'Hid rumor.');
		strictEqual(summarizeNoOp('Nothing changed.'), 'Nothing changed.');
	});
});
