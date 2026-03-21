import type { MarkerId } from './markers/types.ts';

/**
 * Search result across questlog content.
 */
export interface QuestlogSearchResult {
	entityKind: 'quest' | 'rumor';
	entityId: number;
	title: string;
	snippet: string;
	markerId: MarkerId | null;
}
