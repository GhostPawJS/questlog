import { defineQuestlogSkill } from './skill_types.ts';

export const intakeTriageSkill = defineQuestlogSkill({
	name: 'intake-triage',
	description:
		'Triage new asks, ideas, and vague incoming work into the right next step without prematurely committing execution structure.',
	content: `# Intake Triage

Primary tools:
- \`search_questlog\`
- \`capture_rumor\`
- \`inspect_questlog_item\`
- \`shape_work\`

Steps:
1. Start with \`search_questlog\` when the ask might duplicate existing work. Use \`mode: "identify_one"\` when you need one exact target instead of a browse list.
2. If the work is still vague, risky, or under-specified, use \`capture_rumor\` with only the minimum facts that explain what arrived and why it matters.
3. Use \`inspect_questlog_item\` on the returned rumor id when you need to confirm the intake record before deciding what to do next.
4. Use \`shape_work\` for the next honest transition: \`dismiss_rumor\`, \`reopen_rumor\`, or later \`settle_rumor\`.
5. If the ask is already clearly executable, hand off to \`shape_work\` with \`create_quest\` or \`create_questline\` instead of letting it rot in intake.

Outcome handling:
- Treat \`success\` as a usable search or intake result.
- Treat \`no_op\` as confirmation that the rumor is already in the requested state.
- Treat \`needs_clarification\` from \`search_questlog\` as a stop signal: choose among the returned candidates instead of guessing.
- Treat \`error\` as a cue to repair the query or target before continuing.

Failure handling:
- If the ask is urgent but unclear, still capture it first instead of inventing execution detail.
- If similar work already exists, reuse or update that thread instead of creating parallel intake.
- Do not create a quest just because someone asked for something.`,
});
