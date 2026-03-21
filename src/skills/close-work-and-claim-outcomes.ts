import { defineQuestlogSkill } from './skill_types.ts';

export const closeWorkAndClaimOutcomesSkill = defineQuestlogSkill({
	name: 'close-work-and-claim-outcomes',
	description:
		'Close work with the correct terminal lifecycle action, then handle any concrete reward claim as a separate explicit step.',
	content: `# Close Work And Claim Outcomes

Primary tools:
- \`run_quest\`
- \`reward_work\`
- \`review_questlog\`
- \`inspect_questlog_item\`

Steps:
1. Use \`run_quest\` with the correct terminal action: \`finish\` for successful completion or \`abandon\` when the work did not land.
2. Use \`inspect_questlog_item\` or \`review_questlog\` when you need to confirm the exact post-resolution state.
3. If rewards exist, use \`reward_work\` with \`action: "claim"\` as a separate follow-up step.
4. Accept \`no_op\` on repeated reward claim as confirmation that the outcome was already claimed.

Outcome handling:
- Treat \`success\` as a real terminal lifecycle step or reward claim.
- Treat \`no_op\` on claim as valid confirmation, not as a failure.
- Treat \`error\` as a real invalid-state problem that needs diagnosis before retrying.

Failure handling:
- Do not treat quest finish and reward claim as one hidden operation.
- Do not leave reward claim ambiguous after successful closure when the reward matters.
- Do not close work with a fake success outcome when it should be abandoned instead.`,
});
