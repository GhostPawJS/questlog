import type { QuestlogDb } from './database.ts';
import { initQuestlineTables } from './questlines/init_questline_tables.ts';
import { initQuestSearch } from './quests/init_quest_search.ts';
import { initQuestTables } from './quests/init_quest_tables.ts';
import { initRepeatableQuestTables } from './repeatable_quests/init_repeatable_quest_tables.ts';
import { initRewardTables } from './rewards/init_reward_tables.ts';
import { initRumorSearch } from './rumors/init_rumor_search.ts';
import { initRumorTables } from './rumors/init_rumor_tables.ts';
import { initTagTables } from './tags/init_tag_tables.ts';
import { initUnlockTables } from './unlocks/init_unlock_tables.ts';

/**
 * Creates the full standalone questlog schema, including FTS and indexing.
 */
export function initQuestlogTables(db: QuestlogDb): void {
	initRumorTables(db);
	initQuestlineTables(db);
	initRepeatableQuestTables(db);
	initQuestTables(db);
	initUnlockTables(db);
	initRewardTables(db);
	initTagTables(db);
	initQuestSearch(db);
	initRumorSearch(db);
}
