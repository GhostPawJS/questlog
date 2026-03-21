import { captureRumorTool } from './capture_rumor_tool.ts';
import { inspectQuestlogItemTool } from './inspect_questlog_item_tool.ts';
import { manageRepeatableTool } from './manage_repeatable_tool.ts';
import { organizeWorkTool } from './organize_work_tool.ts';
import { planQuestTool } from './plan_quest_tool.ts';
import { retireWorkTool } from './retire_work_tool.ts';
import { reviewQuestlogTool } from './review_questlog_tool.ts';
import { rewardWorkTool } from './reward_work_tool.ts';
import { runQuestTool } from './run_quest_tool.ts';
import { searchQuestlogTool } from './search_questlog_tool.ts';
import { shapeWorkTool } from './shape_work_tool.ts';
import { tagWorkTool } from './tag_work_tool.ts';
import type { ToolDefinitionRegistry } from './tool_metadata.ts';

export const questlogTools = [
	searchQuestlogTool,
	reviewQuestlogTool,
	inspectQuestlogItemTool,
	captureRumorTool,
	shapeWorkTool,
	planQuestTool,
	runQuestTool,
	organizeWorkTool,
	manageRepeatableTool,
	tagWorkTool,
	rewardWorkTool,
	retireWorkTool,
] satisfies ToolDefinitionRegistry;

export function listQuestlogToolDefinitions() {
	return [...questlogTools];
}

export function getQuestlogToolByName(name: string) {
	return questlogTools.find((tool) => tool.name === name) ?? null;
}
