import { ok, strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import { captureRumorTool, inspectQuestlogItemTool, shapeWorkTool } from './index.ts';

describe('tool facade reliability cases', () => {
	let db: QuestlogDb;

	beforeEach(async () => {
		db = await createInitializedQuestlogDb();
	});

	it('keeps follow-up refs and next hints composable across tool boundaries', () => {
		const captured = captureRumorTool.handler(db, {
			title: 'Vendor renewal risk',
			now: 1,
		});
		if (captured.outcome !== 'success') {
			throw new Error('expected captured rumor');
		}
		ok(captured.next?.some((hint) => hint.kind === 'inspect_item'));
		ok(captured.next?.some((hint) => hint.kind === 'use_tool' && hint.tool === 'shape_work'));

		const settled = shapeWorkTool.handler(db, {
			action: 'settle_rumor',
			rumorId: captured.data.rumor.id,
			settledAt: 2,
			questline: {
				title: 'Vendor renewal',
				description: 'Coordinate the renegotiation work.',
			},
			quests: [
				{
					title: 'Review contract',
					objective: 'Read the revised terms.',
				},
			],
		});
		if (settled.outcome !== 'success' || !settled.data.questline || !settled.data.quests?.[0]) {
			throw new Error('expected settled rumor with downstream structure');
		}

		strictEqual(settled.data.primary?.kind, 'rumor');
		strictEqual(
			settled.data.created?.some((ref) => ref.kind === 'questline'),
			true,
		);
		strictEqual(
			settled.data.created?.some((ref) => ref.kind === 'quest'),
			true,
		);
		strictEqual(settled.data.updated?.[0]?.kind, 'rumor');
		strictEqual(settled.next?.[0]?.kind, 'review_view');

		const inspected = inspectQuestlogItemTool.handler(db, {
			target: { kind: 'quest', id: settled.data.quests[0].id },
			detailLevel: 'full',
		});
		if (inspected.outcome !== 'success') {
			throw new Error('expected inspect success');
		}

		strictEqual(inspected.data.detailLevel, 'full');
		strictEqual(
			inspected.data.related.some((ref) => ref.kind === 'questline'),
			true,
		);
		strictEqual(
			inspected.data.related.some((ref) => ref.kind === 'rumor'),
			true,
		);
	});
});
