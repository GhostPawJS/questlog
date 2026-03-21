import { defineQuestlogSkill } from './skill_types.ts';

export const settleRumorIntoStructureSkill = defineQuestlogSkill({
	name: 'settle-rumor-into-structure',
	description:
		'Turn a ready rumor into committed quest or questline structure without losing provenance or pretending vague intake is settled.',
	content: `# Settle Rumor Into Structure

Primary tools:
- \`capture_rumor\`
- \`shape_work\`
- \`inspect_questlog_item\`
- \`review_questlog\`

Steps:
1. Use \`capture_rumor\` first if the incoming work is not already tracked as intake.
2. When the rumor is ready to graduate, use \`shape_work\` with \`action: "settle_rumor"\`.
3. Include the real downstream structure: one or more quest inputs, a questline input, or both.
4. If \`shape_work\` returns \`needs_clarification\`, answer the missing structure question before retrying.
5. Use \`inspect_questlog_item\` on the rumor or created items when you need to confirm provenance and relationships.
6. Use \`review_questlog\` with \`view: "quests.available"\` when you want to verify that the new concrete work is now visible for execution.

Outcome handling:
- Treat \`success\` as a real commitment transition out of intake.
- Treat \`needs_clarification\` as a normal stop when the downstream structure is still underspecified.
- Treat \`error\` as a sign that the target or input contract needs repair before settlement can continue.

Failure handling:
- If the rumor is still too vague, do not settle it just to clean up intake.
- If only one concrete next step is known, create that exact structure instead of inventing a larger arc.
- Do not leave settled work unverifed; inspect or review the result.`,
});
