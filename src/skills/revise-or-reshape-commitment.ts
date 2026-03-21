import { defineQuestlogSkill } from './skill_types.ts';

export const reviseOrReshapeCommitmentSkill = defineQuestlogSkill({
	name: 'revise-or-reshape-commitment',
	description:
		'Revise a quest objective before execution starts, but reshape commitments honestly with lifecycle tools once real execution history exists.',
	content: `# Revise Or Reshape Commitment

Primary tools:
- \`inspect_questlog_item\`
- \`plan_quest\`
- \`run_quest\`

Steps:
1. Use \`inspect_questlog_item\` to confirm whether the quest has already started or resolved.
2. If the quest has not started, use \`plan_quest\` with \`action: "revise_objective"\` to sharpen the commitment.
3. If execution has already started, do not rewrite history. Use \`run_quest\` to finish, abandon, or abandon-and-spawn follow-up work instead.
4. Accept \`no_op\` when the requested objective is already the current one.

Outcome handling:
- Treat \`success\` as a valid pre-start revision or honest lifecycle reshape.
- Treat \`no_op\` as confirmation that the objective already matches.
- Treat \`error\` from revise-after-start as a rule you should respect, not bypass.

Failure handling:
- Do not revise objective text after real execution has begun.
- Do not hide a broken commitment with wording changes when the truth is that the work must be abandoned or succeeded by follow-ups.
- Do not guess whether a quest has started; inspect it first.`,
});
