import { searchQuestlogToolName } from './tool_names';
import type { ToolEntityRef, ToolFailure, ToolNextStepHint } from './tool_types';
import { toolFailure } from './tool_types';

interface TranslateToolErrorOptions {
	entities?: ToolEntityRef[];
	next?: ToolNextStepHint[];
	summary?: string;
}

function asMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim()) {
		return error.message.trim();
	}
	return 'Unexpected system error.';
}

export function translateToolError(
	error: unknown,
	options: TranslateToolErrorOptions = {},
): ToolFailure {
	const message = asMessage(error);
	const entities = options.entities ?? [];
	const next = options.next;

	if (/was not found\.$/.test(message)) {
		return toolFailure(
			'domain',
			'not_found',
			options.summary ?? 'The requested item was not found.',
			message,
			{
				entities,
				next: next ?? [
					{
						kind: 'use_tool',
						message: 'Search for the correct item first if the id may be wrong.',
						tool: searchQuestlogToolName,
					},
				],
				recovery: 'Use search when the exact id is unknown, then retry with the correct target.',
			},
		);
	}

	if (
		message.includes('must not be empty') ||
		message.includes('must not be negative') ||
		message.includes('must be greater than zero') ||
		message.includes('must be parseable') ||
		message.includes('must be a positive integer') ||
		message.includes('Unsupported RRULE')
	) {
		return toolFailure(
			'protocol',
			'invalid_input',
			options.summary ?? 'The tool input was invalid.',
			message,
			{
				entities,
				next,
				recovery: 'Fix the invalid field values and retry.',
			},
		);
	}

	if (
		message.includes('cannot change after') ||
		message.includes('cannot be started') ||
		message.includes('cannot be resolved again') ||
		message.includes('already been claimed') ||
		message.includes('can only be claimed') ||
		message.includes('cannot be updated') ||
		message.includes('cannot be removed')
	) {
		return toolFailure(
			'domain',
			'invalid_state',
			options.summary ?? 'The request is not valid in the current state.',
			message,
			{
				entities,
				next,
				recovery:
					'Inspect the target item and choose a lifecycle step that matches its current state.',
			},
		);
	}

	if (message === 'A quest cannot unlock itself.' || message === 'Unlock would create a cycle.') {
		return toolFailure(
			'domain',
			'constraint_violation',
			options.summary ?? 'The requested dependency change violates unlock rules.',
			message,
			{
				entities,
				next,
				recovery: 'Remove the invalid dependency or choose a different prerequisite structure.',
			},
		);
	}

	return toolFailure(
		'system',
		'system_error',
		options.summary ?? 'The tool failed unexpectedly.',
		message,
		{
			entities,
			next,
			recovery: 'Inspect the target and retry with a narrower action if the problem persists.',
		},
	);
}
