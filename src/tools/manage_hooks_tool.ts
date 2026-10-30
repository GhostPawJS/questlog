import { listDeliveries, listHooks, removeHook, tickQuestlog } from '../hooks/index.ts';
import {
	booleanSchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	objectSchema,
} from './tool_metadata.ts';
import { type ToolResult, toolFailure, toolSuccess } from './tool_types.ts';

export const manageHooksTool = defineQuestlogTool<
	{
		action: 'list' | 'remove' | 'tick' | 'deliveries';
		id?: number;
		dry_run?: boolean;
	},
	Promise<ToolResult<unknown>>
>({
	name: 'manage_hooks',
	description:
		'List or remove outbound webhook targets, run a tick, or inspect pending and failed deliveries.',
	whenToUse: 'Use to operate configured outbound webhooks. Add and test targets with the CLI.',
	whenNotToUse: 'Use quest tools to change work itself.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['hook'],
	inputDescriptions: {
		action: 'Operation to perform.',
		id: 'Target id for removal.',
		dry_run: 'Preview a tick without recording or sending.',
	},
	outputDescription:
		'Returns redacted targets, delivery metadata, or a tick summary. Never returns signing secrets.',
	inputSchema: objectSchema(
		{
			action: enumSchema('Operation.', ['list', 'remove', 'tick', 'deliveries']),
			id: integerSchema('Target id.'),
			dry_run: booleanSchema('Preview only.'),
		},
		['action'],
	),
	handler: async (db, input) => {
		switch (input.action) {
			case 'list':
				return toolSuccess('Webhook targets.', listHooks(db));
			case 'deliveries':
				return toolSuccess('Pending and failed deliveries.', listDeliveries(db));
			case 'remove':
				if (!Number.isSafeInteger(input.id) || Number(input.id) < 1)
					return toolFailure(
						'protocol',
						'invalid_input',
						'Target id required.',
						'Provide a positive target id.',
						{ recovery: 'Pass {"action":"remove","id":1}' },
					);
				if (!listHooks(db).some((hook) => hook.id === input.id))
					return toolFailure(
						'domain',
						'not_found',
						'The requested hook was not found.',
						`Hook ${input.id} not found`,
						{ recovery: 'List hooks and retry with the correct target id.' },
					);
				removeHook(db, Number(input.id));
				return toolSuccess('Webhook target removed.', {});
			case 'tick':
				return toolSuccess(
					'Webhook tick completed.',
					await tickQuestlog(db, { dryRun: input.dry_run ?? false }),
				);
		}
	},
});
