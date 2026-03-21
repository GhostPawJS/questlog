import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inspectQuestlogItemTool, organizeWorkTool, shapeWorkTool } from '../tools/index.ts';
import { frameInitiativeQuestlineSkill } from './frame-initiative-questline.ts';
import {
	createSkillTestDb,
	expectNoOp,
	expectSkillAvoidsDirectApi,
	expectSkillMentionsTools,
	expectSuccess,
} from './skill_test_utils.ts';

describe('frameInitiativeQuestlineSkill', () => {
	it('creates an initiative questline, attaches a quest, and accepts repeated membership as no-op', async () => {
		expectSkillMentionsTools(frameInitiativeQuestlineSkill, [
			'shape_work',
			'organize_work',
			'review_questlog',
			'inspect_questlog_item',
		]);
		expectSkillAvoidsDirectApi(frameInitiativeQuestlineSkill, [
			'createQuestline',
			'moveQuestToQuestline',
			'archiveQuestline',
		]);

		const db = await createSkillTestDb();
		const questline = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_questline',
				questline: {
					title: 'Launch Initiative',
					description: 'Shared launch context.',
				},
			}),
		);
		const quest = expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'create_quest',
				quest: {
					title: 'Draft launch note',
					objective: 'Draft the initial launch note.',
				},
			}),
		);

		expectSuccess(
			shapeWorkTool.handler(db, {
				action: 'attach_quest_to_questline',
				questId: quest.data.quest?.id ?? 0,
				questlineId: questline.data.questline?.id ?? 0,
			}),
		);

		const attachedAgain = expectNoOp(
			shapeWorkTool.handler(db, {
				action: 'attach_quest_to_questline',
				questId: quest.data.quest?.id ?? 0,
				questlineId: questline.data.questline?.id ?? 0,
			}),
		);
		strictEqual(attachedAgain.data.action, 'attach_quest_to_questline');

		const archived = expectSuccess(
			organizeWorkTool.handler(db, {
				action: 'archive_questline',
				questlineId: questline.data.questline?.id ?? 0,
			}),
		);
		strictEqual(archived.data.questline?.archivedAt != null, true);

		const inspected = expectSuccess(
			inspectQuestlogItemTool.handler(db, {
				target: { kind: 'questline', id: questline.data.questline?.id ?? 0 },
			}),
		);
		strictEqual(inspected.data.item.kind, 'questline');
	});
});
