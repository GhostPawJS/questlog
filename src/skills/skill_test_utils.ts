import { ok, strictEqual } from 'node:assert/strict';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import type {
	ToolFailure,
	ToolNeedsClarification,
	ToolResult,
	ToolSuccess,
} from '../tools/tool_types.ts';
import type { QuestlogSkill } from './skill_types.ts';

export async function createSkillTestDb(): Promise<QuestlogDb> {
	return createInitializedQuestlogDb();
}

export function expectSuccess<T>(result: ToolResult<T>): ToolSuccess<T> {
	strictEqual(result.ok, true);
	strictEqual(
		result.outcome === 'success' || result.outcome === 'no_op',
		true,
		'expected success-like outcome',
	);
	return result;
}

export function expectNoOp<T>(result: ToolResult<T>): ToolSuccess<T> {
	strictEqual(result.ok, true);
	strictEqual(result.outcome, 'no_op');
	return result;
}

export function expectClarification<T>(result: ToolResult<T>): ToolNeedsClarification {
	strictEqual(result.ok, false);
	strictEqual(result.outcome, 'needs_clarification');
	return result;
}

export function expectError<T>(result: ToolResult<T>): ToolFailure {
	strictEqual(result.ok, false);
	strictEqual(result.outcome, 'error');
	return result;
}

export function expectSkillMentionsTools(skill: QuestlogSkill, toolNames: string[]) {
	for (const toolName of toolNames) {
		ok(skill.content.includes(`\`${toolName}\``), `expected content to mention ${toolName}`);
	}
}

export function expectSkillAvoidsDirectApi(skill: QuestlogSkill, apiNames: string[]) {
	for (const apiName of apiNames) {
		strictEqual(
			skill.content.includes(`${apiName}(`),
			false,
			`skill content should not mention direct API ${apiName}()`,
		);
	}
}
