import type { JsonSchema } from './surface_types.ts';
export function schemaRows(schema: JsonSchema, prefix = ''): string[] {
	const properties = { ...schema.properties };
	const required = new Set(schema.required);
	for (const branch of schema.oneOf ?? []) {
		Object.assign(properties, branch.properties);
		for (const key of branch.required ?? []) required.add(key);
	}
	return Object.entries(properties).flatMap(([key, property]) => {
		const nested = property.items ?? property;
		const children =
			nested.properties ?? Object.assign({}, ...(nested.oneOf ?? []).map((b) => b.properties));
		const description =
			property.description ||
			(Object.keys(children).length
				? `Object: ${Object.keys(children)
						.map((name) => `${name}${nested.required?.includes(name) ? ' (required)' : ''}`)
						.join(', ')}`
				: property.type === 'array'
					? `Array of ${property.items?.type ?? 'values'}`
					: `Value for ${key}`);
		return [
			`${prefix}${key} | ${property.type ?? 'oneOf'} | ${required.has(key) ? 'yes' : 'no'} | ${(property.enum ? `${property.enum.join(', ')}. ` : '') + description.replaceAll('|', '\\|').replaceAll('\n', ' ')}`,
			...schemaRows(nested, `${prefix}${key}${property.items ? '[]' : ''}.`),
		];
	});
}
