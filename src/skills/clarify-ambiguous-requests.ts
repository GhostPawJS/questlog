import { defineQuestlogSkill } from './skill_types.ts';

export const clarifyAmbiguousRequestsSkill = defineQuestlogSkill({
	name: 'clarify-ambiguous-requests',
	description:
		'Treat ambiguity as a real state, capture uncertainty honestly, and only commit work structure once the next executable shape is clear.',
	content: `# Clarify Ambiguous Requests

Primary tools:
- \`capture_rumor\`
- \`search_questlog\`
- \`inspect_questlog_item\`
- \`shape_work\`

Steps:
1. If the request is still ambiguous, use \`capture_rumor\` instead of forcing it into a quest too early.
2. Use \`search_questlog\` when the ambiguity might really be duplicate or overlapping work instead of net-new intake.
3. Use \`inspect_questlog_item\` when you need the exact current state of the intake item before deciding how to commit it.
4. Once the missing outcome or structure is clear, use \`shape_work\` with the smallest honest action: \`create_quest\`, \`create_questline\`, or \`settle_rumor\`.
5. If \`shape_work\` returns \`needs_clarification\`, answer the missing branch choice before retrying. Do not guess between quests and questlines.

Outcome handling:
- Treat \`success\` as a valid clarification milestone or committed structure change.
- Treat \`needs_clarification\` as expected when the system can see that the request is valid in spirit but still underdetermined.
- Treat \`error\` as a real contract or state problem that must be repaired before continuing.

Failure handling:
- If someone wants speed without clarity, record the uncertainty as intake and move forward honestly.
- If several plausible existing items match, stop at clarification instead of choosing one silently.
- Do not fabricate a crisp quest objective just to make the system look tidy.`,
});
