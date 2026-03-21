import { defineQuestlogSkill } from './skill_types.ts';

export const detectSlipsAndStalenessSkill = defineQuestlogSkill({
	name: 'detect-slips-and-staleness',
	description:
		'Detect work that is slipping or going stale by reading overdue, deferred, in-progress, and related operational views before choosing one recovery move.',
	content: `# Detect Slips And Staleness

Primary tools:
- \`review_questlog\`
- \`inspect_questlog_item\`
- \`plan_quest\`
- \`run_quest\`

Steps:
1. Use \`review_questlog\` to look at overdue, due-soon, deferred, in-progress, or missed-scheduled views.
2. Use \`inspect_questlog_item\` when one slipping item needs exact diagnosis before action.
3. If the problem is timing drift, use \`plan_quest\` to repair the planning state.
4. If the problem is execution drift, use \`run_quest\` for the next real lifecycle move.

Outcome handling:
- Treat empty stale-work views as valid \`success\`.
- Treat \`error\` as a bad view or filter choice, not as evidence that the work is healthy.

Failure handling:
- Do not call work healthy just because it is still open.
- Do not change timing blindly before you inspect the exact item.
- Do not assume a stale item is blocked; diagnose it first.`,
});
