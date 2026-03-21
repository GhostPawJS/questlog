import { strictEqual } from 'node:assert/strict';
import type { QuestlogDb } from '../database.ts';
import { createInitializedQuestlogDb } from '../lib/test-db.ts';
import type { ToolFailure, ToolNeedsClarification, ToolResult, ToolSuccess } from './tool_types.ts';

export async function createToolTestDb(): Promise<QuestlogDb> {
	return createInitializedQuestlogDb();
}

export function expectSuccess<T>(result: ToolResult<T>): ToolSuccess<T> {
	strictEqual(result.ok, true);
	strictEqual(result.outcome === 'success' || result.outcome === 'no_op', true);
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
