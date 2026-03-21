import { defineQuestlogSkill } from './skill_types.ts';

export const recoverFromModelingMistakesSkill = defineQuestlogSkill({
	name: 'recover-from-modeling-mistakes',
	description:
		'Recover from modeling mistakes by diagnosing the exact current state first, then applying the smallest honest corrective tool instead of rewriting history blindly.',
	content: `# Recover From Modeling Mistakes

Primary tools:
- \`inspect_questlog_item\`
- \`review_questlog\`
- \`shape_work\`
- \`organize_work\`
- \`plan_quest\`
- \`retire_work\`

Steps:
1. Diagnose first with \`inspect_questlog_item\` or the appropriate \`review_questlog\` view.
2. Choose the smallest honest fix: re-plan timing, change structure, correct unlocks, archive or hide an item, or reshape successor work.
3. Prefer a corrective move that preserves truthful history over one that merely makes the surface look cleaner.
4. Re-run inspect or review after the correction to confirm the model now matches reality.

Outcome handling:
- Treat \`success\` as confirmation that the smallest honest correction landed.
- Treat \`no_op\` as a clue that the model may already match the intended correction.
- Treat \`error\` as a sign you still have not diagnosed the issue precisely enough.

Failure handling:
- Do not start with mutation before diagnosis.
- Do not erase real execution history just to hide a modeling error.
- Do not stack multiple speculative corrections when one targeted fix will do.`,
});
