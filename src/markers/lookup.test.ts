import { deepStrictEqual, match, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { markerLookup } from './lookup';
import type { MarkerId } from './types';

const markerIds: MarkerId[] = [
	'attention.available',
	'attention.available.repeatable',
	'attention.available.future',
	'progress.incomplete',
	'progress.complete',
];

describe('markerLookup', () => {
	it('defines every marker id exactly once', () => {
		deepStrictEqual(Object.keys(markerLookup).sort(), [...markerIds].sort());
		for (const id of markerIds) {
			strictEqual(markerLookup[id].id, id);
		}
	});

	it('keeps attention markers on exclamation marks and progress markers on question marks', () => {
		for (const id of markerIds) {
			const definition = markerLookup[id];
			if (definition.family === 'attention') {
				strictEqual(definition.symbol, '!');
			}
			if (definition.family === 'progress') {
				strictEqual(definition.symbol, '?');
			}
		}
	});

	it('keeps repeatable markers blue and future markers gray', () => {
		strictEqual(markerLookup['attention.available.repeatable'].wowColor, 'blue');
		strictEqual(markerLookup['attention.available.future'].wowColor, 'gray');
	});

	it('exposes stable plain, tty, and html-facing metadata for every marker', () => {
		for (const id of markerIds) {
			const definition = markerLookup[id];
			strictEqual(definition.plainText.length > 0, true);
			strictEqual(definition.ttyText.length > 0, true);
			match(definition.htmlClass, /^[a-z0-9-]+$/);
		}
		strictEqual(markerLookup['progress.complete'].label, 'Turn-in pending');
		strictEqual(markerLookup['progress.complete'].plainText, '? turn-in pending');
	});
});
