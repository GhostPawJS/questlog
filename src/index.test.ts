import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as questlog from './index.ts';

describe('package index (public entry)', () => {
	it('exposes the intentional public surface', () => {
		strictEqual(typeof questlog.markers, 'object');
		strictEqual(typeof questlog.read, 'object');
		strictEqual(typeof questlog.skills, 'object');
		strictEqual(typeof questlog.soul, 'object');
		strictEqual(typeof questlog.tools, 'object');
		strictEqual(typeof questlog.write, 'object');
		strictEqual(typeof questlog.initQuestlogTables, 'function');
		strictEqual(typeof questlog.read.searchQuestlog, 'function');
		strictEqual(typeof questlog.read.listAvailableQuests, 'function');
		strictEqual(typeof questlog.write.createQuest, 'function');
		strictEqual(typeof questlog.tools.questlogTools, 'object');
		strictEqual(typeof questlog.skills.questlogSkills, 'object');
		strictEqual(typeof questlog.soul.questlogSoul, 'object');
		strictEqual(typeof questlog.soul.renderQuestlogSoulPromptFoundation, 'function');
		strictEqual(typeof questlog.markers.deriveQuestMarkerId, 'function');
		strictEqual(typeof questlog.markers.deriveRumorMarkerId, 'function');
		strictEqual(typeof questlog.markers.markerLookup, 'object');

		strictEqual('getQuestOrThrow' in questlog.read, false);
		strictEqual('getRumorOrThrow' in questlog.read, false);
		strictEqual('deriveQuestMarkerId' in questlog.read, false);
		strictEqual('markerLookup' in questlog.read, false);

		strictEqual('questlogSoul' in questlog, false);
		strictEqual('renderQuestlogSoulPromptFoundation' in questlog, false);
		strictEqual('searchQuestlog' in questlog, false);
		strictEqual('createQuest' in questlog, false);
		strictEqual('listAvailableQuests' in questlog, false);
		strictEqual('deriveQuestMarkerId' in questlog, false);
		strictEqual('markerLookup' in questlog, false);
		strictEqual('resolveQuest' in questlog, false);
		strictEqual('getQuestOrThrow' in questlog, false);
		strictEqual('getRumorOrThrow' in questlog, false);
		strictEqual('mapQuestRow' in questlog, false);
		strictEqual('parseRRule' in questlog, false);
		strictEqual('wouldCreateUnlockCycle' in questlog, false);
	});
});
