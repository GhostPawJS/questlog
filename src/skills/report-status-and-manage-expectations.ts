import { defineQuestlogSkill } from './skill_types.ts';

export const reportStatusAndManageExpectationsSkill = defineQuestlogSkill({
	name: 'report-status-and-manage-expectations',
	description:
		'Build status reporting from the real questlog state, separating available, blocked, in-progress, slipping, and resolved work without relying on memory.',
	content: `# Report Status And Manage Expectations

Primary tools:
- \`review_questlog\`
- \`inspect_questlog_item\`

Steps:
1. Use \`review_questlog\` to assemble the current slices that matter: available, blocked, in-progress, overdue, resolved, or questlines.
2. Use \`inspect_questlog_item\` when one item needs exact detail before you report its state or risk.
3. Report what the system actually shows instead of compressing everything into one vague summary.
4. If a stakeholder asks about something that is not in the system, say that explicitly and capture or shape it separately instead of bluffing.

Outcome handling:
- Treat empty review views as valid status facts.
- Treat \`error\` as a bad view or filter contract that must be fixed before reporting.

Failure handling:
- Do not rely on memory when the system can answer directly.
- Do not call blocked work available just because it is important.
- Do not merge resolved and reward-unclaimed states into one misleading status line.`,
});
