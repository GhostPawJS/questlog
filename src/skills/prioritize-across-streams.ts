import { defineQuestlogSkill } from './skill_types.ts';

export const prioritizeAcrossStreamsSkill = defineQuestlogSkill({
	name: 'prioritize-across-streams',
	description:
		'Prioritize across competing work streams by reading real candidate sets, distinguishing available from blocked work, and then reflecting the choice in planning.',
	content: `# Prioritize Across Streams

Primary tools:
- \`review_questlog\`
- \`inspect_questlog_item\`
- \`plan_quest\`

Steps:
1. Use \`review_questlog\` to assemble the real candidate pool: available, blocked, due-soon, overdue, or questline slices.
2. Use \`inspect_questlog_item\` on a candidate when the row is not enough to decide.
3. Prioritize from the available work, not from blocked wishful thinking.
4. Reflect the choice in \`plan_quest\` so the system shows what is actually next.

Outcome handling:
- Treat blocked candidates as real constraints, not as silent ties.
- Treat empty views as real signal about the current portfolio state.

Failure handling:
- Do not choose blocked work as if it were executable now.
- Do not pretend a priority decision exists if the candidate pool is still unclear.
- Do not leave the system unchanged after deciding what should move next.`,
});
