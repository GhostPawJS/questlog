import { defineQuestlogSkill } from './skill_types.ts';

export const escalateAndUnblockSkill = defineQuestlogSkill({
	name: 'escalate-and-unblock',
	description:
		'Diagnose blockers honestly, then remove or realign hard gates when the model is wrong instead of treating every delay as generic escalation theater.',
	content: `# Escalate And Unblock

Primary tools:
- \`review_questlog\`
- \`inspect_questlog_item\`
- \`organize_work\`
- \`plan_quest\`

Steps:
1. Use \`review_questlog\` to confirm whether work is actually blocked.
2. Use \`inspect_questlog_item\` to diagnose the exact blocker on the affected quest.
3. If the unlock graph is wrong, use \`organize_work\` to remove or replace the blocker set.
4. If the work is not truly blocked, use planning changes instead of fake escalation language.

Outcome handling:
- Treat \`success\` as a real unblock step.
- Treat \`error\` as a structural issue that still needs diagnosis.

Failure handling:
- Do not call work blocked when it is only unclear or underspecified.
- Do not leave a quest in the blocked state after the model has changed.
- Do not remove prerequisites casually; inspect before unblocking.`,
});
