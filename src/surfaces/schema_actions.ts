import type { JsonSchema } from './surface_types.ts';

const requirements = new WeakMap<JsonSchema, Record<string, readonly string[]>>();

export function registerSchemaActions(
	schema: JsonSchema,
	actions: Record<string, readonly string[]>,
) {
	requirements.set(schema, actions);
}

export function requiredForAction(schema: JsonSchema, action: unknown): readonly string[] {
	return requirements.get(schema)?.[String(action)] ?? [];
}
