/**
 * A hard prerequisite relation where one quest must resolve successfully before another becomes available.
 */
export interface QuestUnlock {
	id: number;
	fromQuestId: number;
	toQuestId: number;
	createdAt: number;
	deletedAt: number | null;
}
