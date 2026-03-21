import type { ToolEntityRef, ToolNextStepHint } from './tool_types';

export function inspectItemNext(target: ToolEntityRef): ToolNextStepHint {
	return {
		kind: 'inspect_item',
		message: `Inspect ${target.kind} ${target.id} for full detail.`,
		tool: 'inspect_questlog_item',
		suggestedInput: {
			target: {
				kind: target.kind,
				id: target.id,
			},
		},
	};
}

export function reviewViewNext(
	view: string,
	suggestedInput: Record<string, unknown> = {},
): ToolNextStepHint {
	return {
		kind: 'review_view',
		message: `Review the \`${view}\` operational view next.`,
		tool: 'review_questlog',
		suggestedInput: {
			view,
			...suggestedInput,
		},
	};
}

export function retryWithNext(
	message: string,
	suggestedInput: Record<string, unknown>,
): ToolNextStepHint {
	return {
		kind: 'retry_with',
		message,
		suggestedInput,
	};
}

export function useToolNext(
	tool: string,
	message: string,
	suggestedInput: Record<string, unknown> = {},
): ToolNextStepHint {
	return {
		kind: 'use_tool',
		message,
		tool,
		suggestedInput,
	};
}

export function askUserNext(message: string): ToolNextStepHint {
	return {
		kind: 'ask_user',
		message,
	};
}
