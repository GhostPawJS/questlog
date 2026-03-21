/**
 * A normalized cross-cutting label for concrete quests.
 */
export interface Tag {
	id: number;
	name: string;
	normalizedName: string;
	createdAt: number;
	deletedAt: number | null;
}
