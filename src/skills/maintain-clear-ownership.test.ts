import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	inspectQuestlogItemTool,
	reviewQuestlogTool,
	shapeWorkTool,
	tagWorkTool,
} from '../tools/index.ts';
import { maintainClearOwnershipSkill } from './maintain-clear-ownership.ts';
import {
	createSkillTestDb,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('maintainClearOwnershipSkill', () => {
	it('keeps ownership explicit through content and classification without inventing an assignee API', async () => {
		expectSkillMentionsTools(maintainClearOwnershipSkill, [
			'shape_work',
			'tag_work',
			'inspect_questlog_item',
			'review_questlog',
		]);
		expectSkillAvoidsDirectApi(maintainClearOwnershipSkill, [
			'assignQuest',
			'setOwner',
			'claimQuest',
		]);

		const db = await createSkillTestDb();
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Alex: draft client note',
					objective: 'Alex owns the next draft of the client note.',
				},
			}),
		);
		const questId = quest.data.quest?.id ?? 0;

		expectSuccess(
			tagWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: questId },
				tagNames: ['owner-alex'],
			}),
		);

		const inspected = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'quest', id: questId },
			}),
		);
		strictEqual(inspected.data.item.kind, 'quest');

		const ownershipSlice = expectSuccess(
			reviewQuestlogTool.handler(db, {
				view: 'quests.available',
				filters: { tagNames: ['owner-alex'] },
			}),
		);
		strictEqual(ownershipSlice.data.count, 1);

		const repeatedTag = expectNoOp(
			tagWorkTool.handler(db, {
				action: 'add',
				target: { kind: 'quest', id: questId },
				tagNames: ['owner-alex'],
			}),
		);
		strictEqual(repeatedTag.data.action, 'add');
	});
});
