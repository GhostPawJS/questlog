import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { captureRumorTool } from './capture_rumor_tool.ts';
import * as tools from './index.ts';
import { manageRepeatableTool } from './manage_repeatable_tool.ts';
import { questlogToolMappings } from './tool_mapping.ts';
import { defineQuestlogTool } from './tool_metadata.ts';
import { captureRumorToolName } from './tool_names.ts';
import { questlogTools } from './tool_registry.ts';
import { toolSuccess } from './tool_types.ts';

describe('tools barrel', () => {
	it('re-exports tool definitions, helpers, metadata, and registries', () => {
		strictEqual(tools.captureRumorTool, captureRumorTool);
		strictEqual(tools.manageRepeatableTool, manageRepeatableTool);
		strictEqual(tools.defineQuestlogTool, defineQuestlogTool);
		strictEqual(tools.questlogToolMappings, questlogToolMappings);
		strictEqual(tools.captureRumorToolName, captureRumorToolName);
		strictEqual(tools.questlogTools, questlogTools);
		strictEqual(tools.toolSuccess, toolSuccess);
	});

	it('keeps registry lookup wiring reachable through the barrel', () => {
		deepStrictEqual(tools.listQuestlogToolDefinitions(), [...questlogTools]);
		strictEqual(tools.getQuestlogToolByName('capture_rumor'), captureRumorTool);
	});
});
