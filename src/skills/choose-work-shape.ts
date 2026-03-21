import { defineQuestlogSkill } from './skill_types.ts';

export const chooseWorkShapeSkill = defineQuestlogSkill({
	name: 'choose-work-shape',
	description:
		'Choose the right structure for new work by separating uncertainty, one-shot execution, multi-step arcs, and recurring patterns.',
	content: `# Choose Work Shape

Primary tools:
- \`capture_rumor\`
- \`shape_work\`
- \`manage_repeatable\`
- \`inspect_questlog_item\`

Steps:
1. Use \`capture_rumor\` when the work is still uncertain, interpretive, or politically fuzzy.
2. Use \`shape_work\` with \`create_quest\` when there is one concrete executable step with one honest objective.
3. Use \`shape_work\` with \`create_questline\` when several related quests need shared initiative context.
4. Use \`manage_repeatable\` with \`create\` when the work is a cadence that should spawn fresh quests over time.
5. Use \`shape_work\` with \`settle_rumor\` when a rumor is ready to graduate into committed quest or questline structure.
6. Use \`inspect_questlog_item\` after creation when you need to confirm the chosen shape before planning or execution.

Outcome handling:
- Treat \`success\` as confirmation that the chosen shape now exists in the system.
- Treat \`needs_clarification\` as a sign that the shape choice is still incomplete and should not be guessed.
- Treat \`error\` as a sign that the requested shape or inputs are invalid as entered.

Failure handling:
- If the work feels both vague and actionable, keep it as a rumor until one executable step is truly obvious.
- Do not create a repeatable just because something happened twice.
- Do not force a questline when one real quest would be enough.`,
});
