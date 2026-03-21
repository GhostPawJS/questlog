import { defineQuestlogSkill } from './skill_types.ts';

export const planSuccessorWorkSkill = defineQuestlogSkill({
	name: 'plan-successor-work',
	description:
		'Create explicit successor work after closure by spawning follow-ups or shaping new work, while keeping uncertain next steps in intake instead of faking certainty.',
	content: `# Plan Successor Work

Primary tools:
- \`run_quest\`
- \`shape_work\`
- \`capture_rumor\`
- \`inspect_questlog_item\`

Steps:
1. If successor work is already clear at abandonment time, use \`run_quest\` with \`action: "abandon_and_spawn_followups"\`.
2. If the current quest should finish cleanly before successor work is created, use \`run_quest\` first and then use \`shape_work\` for the new quest or questline.
3. If the next step is still fuzzy, use \`capture_rumor\` instead of inventing a fake follow-up.
4. Use \`inspect_questlog_item\` on spawned or newly created work when you need to confirm the handoff.

Outcome handling:
- Treat \`success\` as a real successor planning step.
- Treat \`error\` from empty follow-up spawn requests as a signal to use plain abandon or another honest path instead.

Failure handling:
- Do not abandon-and-spawn with an empty follow-up list.
- Do not invent successor work when the real next step is still uncertain.
- Do not leave successor work implied but unmodeled when it is already clearly known.`,
});
