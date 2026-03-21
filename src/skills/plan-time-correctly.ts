import { defineQuestlogSkill } from './skill_types.ts';

export const planTimeCorrectlySkill = defineQuestlogSkill({
	name: 'plan-time-correctly',
	description:
		'Use quest planning fields honestly so availability, due pressure, and schedule intent stay meaningful instead of getting collapsed into one generic date.',
	content: `# Plan Time Correctly

Primary tools:
- \`plan_quest\`
- \`review_questlog\`
- \`inspect_questlog_item\`

Steps:
1. Use \`plan_quest\` with \`action: "set_time"\` to change not-before, due, schedule, all-day, or estimate fields.
2. Use \`inspect_questlog_item\` when the current timing state needs exact diagnosis before changing it.
3. Use \`review_questlog\` to verify the downstream effect in deferred, due-soon, overdue, scheduled-now, or missed-scheduled views.
4. If the exact timing request is unchanged, accept the \`no_op\` result instead of forcing meaningless churn.

Outcome handling:
- Treat \`success\` as a real planning change.
- Treat \`no_op\` as confirmation that the planning state is already correct.
- Treat \`error\` as conflicting or invalid timing input that must be repaired before retrying.

Failure handling:
- Do not use one date field to mean every kind of timing intent.
- Do not assume a schedule miss is the same as being overdue.
- Do not re-plan blindly without first understanding the current quest timing state.`,
});
