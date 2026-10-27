import { requiredForAction } from './schema_actions.ts';
import type { JsonSchema } from './surface_types.ts';

export function minimalInput(schema: JsonSchema, action?: unknown, name = ''): unknown {
	const constant = 'const' in schema ? schema.const : undefined;
	if (constant !== undefined) return constant;
	if (schema.enum)
		return action !== undefined && schema.enum.includes(action) ? action : schema.enum[0];
	const branch = schema.oneOf?.[0];
	if (schema.type === 'object' || schema.properties) {
		action ??= schema.properties?.action?.enum?.[0];
		const properties = { ...schema.properties, ...branch?.properties };
		return Object.fromEntries(
			[
				...new Set([
					...(schema.required ?? []),
					...requiredForAction(schema, action),
					...(schema.properties?.outcome &&
					['finish', 'abandon', 'abandon_and_spawn_followups'].includes(String(action))
						? ['outcome']
						: []),
					...(branch?.required ?? []),
				]),
			].map((key) => [
				key,
				minimalInput(properties[key] ?? {}, key === 'action' ? action : undefined, key),
			]),
		);
	}
	if (branch) return minimalInput(branch, action, name);
	if (schema.type === 'array') return [minimalInput(schema.items ?? {}, undefined, name)];
	if (schema.type === 'integer' || schema.type === 'number')
		return name === 'anchorAt' ? 1800000000000 : name === 'toQuestId' ? 2 : 1;
	if (schema.type === 'boolean') return false;
	if (schema.type === 'null') return null;
	if (name === 'rrule') return 'FREQ=WEEKLY';
	if (name === 'title') return 'Review release notes';
	if (name === 'objective') return 'Check changes against the release';
	return 'release';
}
