import { captureRumorTool } from './capture_rumor_tool';
import { inspectQuestlogItemTool } from './inspect_questlog_item_tool';
import { manageRepeatableTool } from './manage_repeatable_tool';
import { organizeWorkTool } from './organize_work_tool';
import { planQuestTool } from './plan_quest_tool';
import { retireWorkTool } from './retire_work_tool';
import { reviewQuestlogTool } from './review_questlog_tool';
import { rewardWorkTool } from './reward_work_tool';
import { runQuestTool } from './run_quest_tool';
import { searchQuestlogTool } from './search_questlog_tool';
import { shapeWorkTool } from './shape_work_tool';
import { tagWorkTool } from './tag_work_tool';
import type { ToolDefinitionRegistry } from './tool_metadata';

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
