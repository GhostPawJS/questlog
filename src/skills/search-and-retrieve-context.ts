import { defineQuestlogSkill } from './skill_types.ts';

export const searchAndRetrieveContextSkill = defineQuestlogSkill({
	name: 'search-and-retrieve-context',
	description:
		'Find relevant questlog context quickly, then switch from discovery to exact inspection without confusing free-text search with structured review surfaces.',
	content: `# Search And Retrieve Context

Primary tools:
- \`search_questlog\`
- \`review_questlog\`
- \`inspect_questlog_item\`

Steps:
1. Use \`search_questlog\` for free-text discovery across quests and rumors when you do not know the exact id yet.
2. Use \`mode: "identify_one"\` when you need one exact target and want the tool to stop at clarification instead of guessing.
3. Once you know the item id, switch to \`inspect_questlog_item\` for exact detail.
4. If the thing you need is better represented as a structured list or a non-FTS entity kind, use \`review_questlog\` instead of forcing search to do the wrong job.
5. Use \`detailLevel: "compact"\` by default and ask for \`detailLevel: "full"\` only when the richer payload is truly needed.

Outcome handling:
- Treat empty \`search_questlog\` results as valid \`success\`, not as proof that nothing relevant exists everywhere.
- Treat \`needs_clarification\` from identify-one search as a cue to choose a candidate.
- Treat \`error\` as a malformed query or invalid target problem.

Failure handling:
- Do not assume full-text search covers questlines, repeatable definitions, or every relational angle.
- Do not keep browsing when you already have an exact item id; inspect it.
- Do not read large full-detail payloads unless the next decision needs them.`,
});
