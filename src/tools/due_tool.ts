import { type DueInput, selectDue } from '../due.ts';
import {
	arraySchema,
	defineQuestlogTool,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { dueToolName } from './tool_names.ts';
import { toolFailure, toolSuccess } from './tool_types.ts';

export const dueTool = defineQuestlogTool({
	name: dueToolName,
	description:
		'Select open due quests and recurring occurrences, optionally claiming them per consumer.',
	whenToUse: 'Read due work or claim a batch for an automation consumer.',
	whenNotToUse: 'Use inspection tools for full entity details.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['quest', 'repeatable_quest'],
	inputDescriptions: {
		within: 'Duration, default 0m.',
		tags: 'Require every tag.',
		limit: 'Default 100; maximum 1000.',
		claim: 'Independent consumer name.',
		release: 'Quest id or occurrence:<repeatableId>:<epoch milliseconds>; requires claim.',
	},
	outputDescription:
		'Items with stable keys, dueAt, overdue and tags, plus hasMore. Release removes a claim without selecting items.',
	inputSchema: objectSchema(
		{
			within: stringSchema('Duration: 15m, 2h, 1d, 7d; default 0m.'),
			tags: arraySchema(stringSchema('Tag.'), 'Require every tag.'),
			limit: integerSchema('Default 100, maximum 1000.'),
			claim: stringSchema('Consumer name; records claims.'),
			release: stringSchema('Quest id or occurrence:<repeatableId>:<timestamp>.'),
		},
		[],
	),
	handler: (db, input: DueInput) => {
		try {
			const data = selectDue(db, input);
			return toolSuccess(
				input.release ? 'Claim released.' : `${data.items.length} due items.`,
				data,
			);
		} catch (error) {
			return toolFailure(
				'protocol',
				'invalid_input',
				String(error instanceof Error ? error.message : error),
				'Check due inputs.',
			);
		}
	},
});
