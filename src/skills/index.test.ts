import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as skills from './index.ts';
import { intakeTriageSkill } from './intake-triage.ts';
import { defineQuestlogSkill } from './skill_types.ts';

describe('skills barrel', () => {
	it('re-exports canonical skills and registry helpers', () => {
		strictEqual(skills.intakeTriageSkill, intakeTriageSkill);
		strictEqual(skills.defineQuestlogSkill, defineQuestlogSkill);
		strictEqual(skills.getQuestlogSkillByName('intake-triage'), intakeTriageSkill);
		strictEqual(skills.questlogSkills.includes(intakeTriageSkill), true);
	});

	it('keeps runtime skill registry wiring reachable through the barrel', () => {
		const listed = skills.listQuestlogSkills();

		strictEqual(Array.isArray(listed), true);
		strictEqual(listed === skills.questlogSkills, false);
		strictEqual(listed[0], skills.questlogSkills[0]);
	});
});
