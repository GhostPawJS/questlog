import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defineQuestlogSkill } from './skill_types.ts';

describe('defineQuestlogSkill', () => {
	it('returns the exact skill object unchanged', () => {
		const skill = {
			name: 'demo-skill',
			description: 'Demo.',
			content: '# Demo',
		};

		const defined = defineQuestlogSkill(skill);

		strictEqual(defined, skill);
		strictEqual(defined.name, 'demo-skill');
	});
});
