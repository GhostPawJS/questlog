import type { QuestlogDb } from '../database.ts';
import { createQuestline } from '../questlines/create_questline.ts';
import { createQuest } from '../quests/create_quest.ts';
import { withTransaction } from '../with_transaction.ts';
import { getRumorOrThrow } from './get_rumor_or_throw.ts';
import type { SettleRumorInput, SettleRumorResult } from './types.ts';

/**
 * Canonically settles a rumor into zero or more downstream artifacts.
 */
export function settleRumor(
	db: QuestlogDb,
	rumorId: number,
	input: SettleRumorInput,
): SettleRumorResult {
	return withTransaction(db, () => {
		const rumor = getRumorOrThrow(db, rumorId);
		const settledAt = input.settledAt ?? Date.now();

		let questline = null;
		if (input.questline) {
			questline = createQuestline(db, {
				...input.questline,
				sourceRumorId: rumor.id,
				now: settledAt,
			});
		}

		const quests = (input.quests ?? []).map((quest) =>
			createQuest(db, {
				...quest,
				sourceRumorId: rumor.id,
				questlineId: quest.questlineId ?? questline?.id ?? null,
				now: settledAt,
			}),
		);

		db.prepare(
			`UPDATE rumors
       SET settled_at = ?, updated_at = ?
       WHERE id = ? AND deleted_at IS NULL`,
		).run(settledAt, settledAt, rumorId);

		return {
			rumor: getRumorOrThrow(db, rumorId),
			questline,
			quests,
		};
	});
}
