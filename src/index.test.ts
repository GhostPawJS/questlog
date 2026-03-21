import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as questlog from './index.ts';

describe('package index (public entry)', () => {
	it('exposes read/write namespaces and schema init as stable entrypoints', () => {
		strictEqual(typeof questlog.read, 'object');
		strictEqual(typeof questlog.write, 'object');
		strictEqual(typeof questlog.initQuestlogTables, 'function');
		strictEqual(typeof questlog.searchQuestlog, 'function');
		strictEqual(typeof questlog.createQuest, 'function');
		strictEqual(typeof questlog.deriveQuestMarkerId, 'function');
		strictEqual(typeof questlog.deriveRumorMarkerId, 'function');
		strictEqual(typeof questlog.markerLookup, 'object');
	});
});
