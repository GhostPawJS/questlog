import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getQuestlogSkillByName, listQuestlogSkills, questlogSkills } from './index.ts';

const directApiNames = [
	'abandonQuest',
	'abandonQuestAndSpawnFollowups',
	'addUnlock',
	'archiveQuestline',
	'archiveRepeatableQuest',
	'captureRumor',
	'claimQuestReward',
	'createQuest',
	'createQuestline',
	'createRepeatableQuest',
	'dismissRumor',
	'finishQuest',
	'getQuestDetail',
	'getRumorDetail',
	'listAvailableQuests',
	'listBlockedQuests',
	'listDueRepeatableQuestAnchors',
	'planQuestTime',
	'removeUnlock',
	'reopenRumor',
	'replaceUnlocks',
	'searchQuestlog',
	'settleRumor',
	'spawnDueRepeatableQuests',
	'startQuest',
	'tagQuest',
];

const toolNames = [
	'capture_rumor',
	'inspect_questlog_item',
	'manage_repeatable',
	'organize_work',
	'plan_quest',
	'retire_work',
	'review_questlog',
	'reward_work',
	'run_quest',
	'search_questlog',
	'shape_work',
	'tag_work',
];

describe('skill registry', () => {
	it('exports a complete runtime skill surface', () => {
		const names = questlogSkills.map((skill) => skill.name);
		const uniqueNames = new Set(names);

		strictEqual(questlogSkills.length, 25);
		strictEqual(uniqueNames.size, questlogSkills.length);
		strictEqual(listQuestlogSkills().length, questlogSkills.length);

		for (const skill of questlogSkills) {
			ok(skill.name.trim().length > 0);
			ok(skill.description.trim().length > 0);
			ok(skill.content.trim().length > 0);
			ok(toolNames.some((toolName) => skill.content.includes(`\`${toolName}\``)));
			strictEqual(getQuestlogSkillByName(skill.name), skill);

			for (const apiName of directApiNames) {
				strictEqual(
					skill.content.includes(`${apiName}(`),
					false,
					`${skill.name} should not teach direct API ${apiName}()`,
				);
			}
		}
	});
});
