import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import {
	captureRumorTool,
	inspectQuestlogItemTool,
	reviewQuestlogTool,
	searchQuestlogTool,
	shapeWorkTool,
} from './index.ts';

describe('tool facade reliability cases', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createInitializedQuestlogDb();
	});

	it('asks for clarification when identify-one search finds multiple plausible matches', () => {
		captureRumorTool.handler(db, { title: 'Vendor pricing changed', now: 1 });
		captureRumorTool.handler(db, { title: 'Vendor terms changed', now: 2 });

		const result = searchQuestlogTool.handler(db, {
			query: 'Vendor',
			mode: 'identify_one',
		});

		strictEqual(result.outcome, 'needs_clarification');
		if (result.outcome !== 'needs_clarification') {
			return;
		}

		strictEqual(result.clarification.code, 'ambiguous_target');
		strictEqual(result.clarification.options?.length, 2);
		deepStrictEqual(result.clarification.missing, ['query']);
	});

	it('asks for the day instead of failing the scheduled-for-day review view', () => {
		const result = reviewQuestlogTool.handler(db, {
			view: 'quests.scheduled_for_day',
		});

		strictEqual(result.outcome, 'needs_clarification');
		if (result.outcome !== 'needs_clarification') {
			return;
		}

		strictEqual(result.clarification.code, 'missing_required_choice');
		deepStrictEqual(result.clarification.missing, ['filters.dayAt']);
	});

	it('asks how to settle a rumor when no downstream structure is provided', () => {
		const captured = captureRumorTool.handler(db, {
			title: 'Security follow-up',
			now: 1,
		});
		if (captured.outcome !== 'success') {
			throw new Error('expected captured rumor');
		}

		const result = shapeWorkTool.handler(db, {
			action: 'settle_rumor',
			rumorId: captured.data.rumor.id,
		});

		strictEqual(result.outcome, 'needs_clarification');
		if (result.outcome !== 'needs_clarification') {
			return;
		}

		deepStrictEqual(result.clarification.missing, ['questline', 'quests']);
	});

	it('returns compact detail by default and full detail on request', () => {
		const created = shapeWorkTool.handler(db, {
			action: 'create_quest',
			quest: {
				title: 'Draft audit',
				objective: 'Write the audit notes.',
				tags: ['ops'],
			},
		});
		if (created.outcome !== 'success' || !created.data.quest) {
			throw new Error('expected created quest');
		}

		const compact = inspectQuestlogItemTool.handler(db, {
			target: { kind: 'quest', id: created.data.quest.id },
		});
		const full = inspectQuestlogItemTool.handler(db, {
			target: { kind: 'quest', id: created.data.quest.id },
			detailLevel: 'full',
		});

		if (compact.outcome !== 'success' || full.outcome !== 'success') {
			throw new Error('expected inspect success');
		}

		strictEqual(compact.data.detailLevel, 'compact');
		strictEqual(full.data.detailLevel, 'full');
		ok(!('rewards' in compact.data.item.detail));
		ok('rewards' in full.data.item.detail);
	});

	it('locks a representative clarification payload shape', () => {
		captureRumorTool.handler(db, { title: 'Alpha vendor', now: 1 });
		captureRumorTool.handler(db, { title: 'Alpha rollout', now: 2 });

		const result = searchQuestlogTool.handler(db, {
			query: 'Alpha',
			mode: 'identify_one',
			limit: 5,
		});

		if (result.outcome !== 'needs_clarification') {
			throw new Error('expected clarification');
		}

		deepStrictEqual(
			{
				ok: result.ok,
				outcome: result.outcome,
				code: result.clarification.code,
				missing: result.clarification.missing,
				optionCount: result.clarification.options?.length ?? 0,
			},
			{
				ok: false,
				outcome: 'needs_clarification',
				code: 'ambiguous_target',
				missing: ['query'],
				optionCount: 2,
			},
		);
	});
});
