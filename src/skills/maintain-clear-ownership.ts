import { defineQuestlogSkill } from './skill_types.ts';

export const maintainClearOwnershipSkill = defineQuestlogSkill({
	name: 'maintain-clear-ownership',
	description:
		'Keep ownership explicit through quest content and classification because Questlog does not provide a separate assignee field or ownership tool.',
	content: `# Maintain Clear Ownership

Primary tools:
- \`shape_work\`
- \`tag_work\`
- \`inspect_questlog_item\`
- \`review_questlog\`

Steps:
1. Use \`shape_work\` to create or settle the real work item with ownership clarity embedded in the title, objective, or narrative details.
2. Use \`tag_work\` when a lightweight ownership or team classification tag helps portfolio review.
3. Use \`inspect_questlog_item\` to confirm the exact wording and current structure of the owned work.
4. Use \`review_questlog\` with tag filters when you need to inspect one ownership slice of the portfolio.

Outcome handling:
- Treat \`success\` as confirmation that the ownership signal is now present in real work structure or classification.
- Treat \`no_op\` as confirmation that the ownership tag or state was already present.

Failure handling:
- Do not invent an assignee field that the system does not have.
- Do not hide unclear ownership behind generic task wording.
- Do not treat tags as a substitute for writing a clear objective or context.`,
});
