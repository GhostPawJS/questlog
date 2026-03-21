import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	arraySchema,
	booleanSchema,
	defineQuestlogTool,
	enumSchema,
	integerSchema,
	literalSchema,
	numberSchema,
	objectSchema,
	oneOfSchema,
	stringSchema,
} from './tool_metadata.ts';
import { toolSuccess } from './tool_types.ts';

describe('tool metadata helpers', () => {
	it('builds stable JSON-schema helper objects', () => {
		deepStrictEqual(stringSchema('Text field'), { type: 'string', description: 'Text field' });
		deepStrictEqual(numberSchema('Numeric field'), {
			type: 'number',
			description: 'Numeric field',
		});
		deepStrictEqual(integerSchema('Integer field'), {
			type: 'integer',
			description: 'Integer field',
		});
		deepStrictEqual(booleanSchema('Boolean field'), {
			type: 'boolean',
			description: 'Boolean field',
		});
		deepStrictEqual(enumSchema('Mode', ['browse', 'identify_one']), {
			type: 'string',
			description: 'Mode',
			enum: ['browse', 'identify_one'],
		});
		deepStrictEqual(enumSchema('Mixed', ['x', 1]), {
			description: 'Mixed',
			enum: ['x', 1],
		});
		deepStrictEqual(literalSchema(null, 'Nothing'), {
			type: 'null',
			const: null,
			description: 'Nothing',
		});
		deepStrictEqual(arraySchema(stringSchema('Tag'), 'Tag list'), {
			type: 'array',
			description: 'Tag list',
			items: { type: 'string', description: 'Tag' },
		});
		deepStrictEqual(objectSchema({ title: stringSchema('Title') }, ['title'], 'Body'), {
			type: 'object',
			description: 'Body',
			properties: { title: { type: 'string', description: 'Title' } },
			required: ['title'],
			additionalProperties: false,
		});
		deepStrictEqual(oneOfSchema([literalSchema('a'), literalSchema('b')], 'Choice'), {
			oneOf: [
				{ type: 'string', const: 'a' },
				{ type: 'string', const: 'b' },
			],
			description: 'Choice',
		});
	});

	it('returns tool definitions unchanged from defineQuestlogTool', () => {
		const definition = {
			name: 'example_tool',
			description: 'Example.',
			whenToUse: 'When needed.',
			whenNotToUse: 'When not needed.',
			sideEffects: 'none' as const,
			readOnly: true,
			supportsClarification: false,
			targetKinds: ['quest'],
			inputDescriptions: { id: 'Target id.' },
			outputDescription: 'Structured result.',
			inputSchema: objectSchema({ id: integerSchema('Target id.') }, ['id']),
			handler: (_db: Parameters<typeof definitionHandler>[0], input: { id: number }) =>
				definitionHandler(_db, input),
		};

		const runtimeDefinition = defineQuestlogTool(definition);

		strictEqual(runtimeDefinition, definition);
		deepStrictEqual(
			runtimeDefinition.handler(null as never, { id: 5 }),
			toolSuccess('ok', { id: 5 }),
		);
	});
});

function definitionHandler(_db: unknown, input: { id: number }) {
	return toolSuccess('ok', { id: input.id });
}
