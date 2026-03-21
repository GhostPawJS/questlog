import { defineQuestlogSkill } from './skill_types.ts';

export const runRecurringRhythmsSkill = defineQuestlogSkill({
	name: 'run-recurring-rhythms',
	description:
		'Model recurring work as repeatable definitions that spawn fresh concrete quests over time instead of living forever as one immortal task.',
	content: `# Run Recurring Rhythms

Primary tools:
- \`manage_repeatable\`
- \`review_questlog\`
- \`inspect_questlog_item\`
- \`run_quest\`

Steps:
1. Use \`manage_repeatable\` with \`action: "create"\` to define the recurring pattern with RRULE and anchor timing.
2. Use \`manage_repeatable\` with \`action: "preview_due"\` or \`review_questlog\` with \`view: "repeatables.due_anchors"\` to inspect what is due.
3. Use \`manage_repeatable\` with \`action: "spawn_due"\` to materialize real concrete quests.
4. Use \`inspect_questlog_item\` or normal execution tools on the spawned quests.
5. Use \`manage_repeatable\` with \`action: "update"\` or \`action: "archive"\` to change future behavior honestly.

Outcome handling:
- Treat empty previews as valid \`success\`.
- Treat empty spawns as a real no-op instead of a failure.
- Treat \`error\` as a repeatable definition or RRULE problem that needs repair.

Failure handling:
- Do not model recurring work as one permanent open quest.
- Do not assume repeatables materialize automatically without \`spawn_due\`.
- Do not rewrite already spawned history when only the future cadence changed.`,
});
