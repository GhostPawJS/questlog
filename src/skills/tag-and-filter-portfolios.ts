import { defineQuestlogSkill } from './skill_types.ts';

export const tagAndFilterPortfoliosSkill = defineQuestlogSkill({
	name: 'tag-and-filter-portfolios',
	description:
		'Use tags for cross-cutting classification and portfolio filtering without confusing tags for status, timing, or dependency modeling.',
	content: `# Tag And Filter Portfolios

Primary tools:
- \`tag_work\`
- \`review_questlog\`
- \`inspect_questlog_item\`

Steps:
1. Use \`tag_work\` to add, remove, or replace classification tags on quests and repeatable definitions.
2. Use \`review_questlog\` with \`filters.tagNames\` to review one tagged slice of the portfolio.
3. Use \`inspect_questlog_item\` when you need the exact detail of a tagged item before changing its classification.

Outcome handling:
- Treat \`success\` as confirmation that the target now has the intended tag set.
- Treat \`no_op\` as confirmation that the requested tag state already existed.
- Treat \`error\` as an invalid target or unsupported action problem.

Failure handling:
- Do not use tags to fake lifecycle state or prerequisites.
- Do not ignore no-op tag responses; they often tell you the portfolio is already classified correctly.
- Do not filter by tags and assume that is the same as a schedule or dependency review.`,
});
