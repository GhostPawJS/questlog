import type { QuestlogDb } from './database';
import { initQuestlineTables } from './questlines/init_questline_tables';
import { initQuestSearch } from './quests/init_quest_search';
import { initQuestTables } from './quests/init_quest_tables';
import { initRepeatableQuestTables } from './repeatable_quests/init_repeatable_quest_tables';
import { initRewardTables } from './rewards/init_reward_tables';
import { initRumorSearch } from './rumors/init_rumor_search';
import { initRumorTables } from './rumors/init_rumor_tables';
import { initTagTables } from './tags/init_tag_tables';
import { initUnlockTables } from './unlocks/init_unlock_tables';

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
