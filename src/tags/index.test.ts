import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as tags from './index';

describe('tags barrel', () => {
	it('exports tagging helpers used by quests and repeatables', () => {
		strictEqual(typeof tags.tagQuest, 'function');
		strictEqual(typeof tags.untagQuest, 'function');
		strictEqual(typeof tags.replaceRepeatableQuestTags, 'function');
	});
});
