import type { Quest } from '../quests/types.ts';

export function questResolutionFields({
	outcome,
	resolvedAt,
}: Pick<Quest, 'outcome' | 'resolvedAt'>): { outcome?: string; resolvedAt?: number } {
	const fields: { outcome?: string; resolvedAt?: number } = {};
	if (outcome != null) fields.outcome = outcome;
	if (resolvedAt != null) fields.resolvedAt = resolvedAt;
	return fields;
}
