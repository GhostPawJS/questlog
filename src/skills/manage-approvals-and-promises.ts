import { defineQuestlogSkill } from './skill_types.ts';

export const manageApprovalsAndPromisesSkill = defineQuestlogSkill({
	name: 'manage-approvals-and-promises',
	description:
		'Treat approvals and commitments as modeled work with timing and dependencies instead of burying them as vague narrative promises.',
	content: `# Manage Approvals And Promises

Primary tools:
- \`shape_work\`
- \`organize_work\`
- \`plan_quest\`
- \`review_questlog\`

Steps:
1. Model the approval step as a concrete quest instead of a hidden note.
2. Model dependent execution work separately and connect it with \`organize_work\` unlocks when the approval is a hard prerequisite.
3. Use \`plan_quest\` to record the real timing pressure on the approval and the dependent work.
4. Use \`review_questlog\` to confirm which approval work is blocked, due soon, or overdue.

Outcome handling:
- Treat \`success\` as confirmation that the promise is now visible in real work structure.
- Treat blocked review results as a truth to manage, not as an inconvenience to hide.

Failure handling:
- Do not bury approvals inside another quest objective.
- Do not pretend a promise is safe if the approval quest is already overdue.
- Do not skip the unlock when the downstream work truly cannot start yet.`,
});
