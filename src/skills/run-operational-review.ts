import { defineQuestlogSkill } from './skill_types.ts';

export const runOperationalReviewSkill = defineQuestlogSkill({
	name: 'run-operational-review',
	description:
		'Drive daily or weekly operational review from structured list views, then move from diagnosis into actual planning or execution changes.',
	content: `# Run Operational Review

Primary tools:
- \`review_questlog\`
- \`inspect_questlog_item\`
- \`plan_quest\`
- \`run_quest\`

Steps:
1. Start with \`review_questlog\` and choose the right operational surface such as available, blocked, deferred, overdue, in-progress, or scheduled views.
2. Use \`inspect_questlog_item\` when one row needs a closer read before acting.
3. If the review reveals timing drift, use \`plan_quest\` to correct the planning state.
4. If the review reveals executable work that should actually move, use \`run_quest\` for lifecycle progress.
5. End the review with at least one honest system change when the review uncovered something actionable.

Outcome handling:
- Treat empty review views as valid \`success\`.
- Treat \`needs_clarification\` as expected when a view like \`quests.scheduled_for_day\` requires a day choice.
- Treat \`error\` as a sign that the chosen view or filter combination is invalid.

Failure handling:
- Do not substitute search for a structured review surface.
- Do not stop at observation when the review surfaced a real next action.
- Do not guess a day-specific schedule view without providing the day.`,
});
