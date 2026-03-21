import { defineQuestlogSkill } from './skill_types.ts';

export const archiveDeleteAndPruneSkill = defineQuestlogSkill({
	name: 'archive-delete-and-prune',
	description:
		'Choose the right retirement action for each kind of work so history stays honest and hiding does not get confused with archival or terminal execution truth.',
	content: `# Archive Delete And Prune

Primary tools:
- \`shape_work\`
- \`organize_work\`
- \`manage_repeatable\`
- \`retire_work\`
- \`run_quest\`

Steps:
1. Use \`shape_work\` to dismiss rumors when intake should be retired without becoming committed work.
2. Use \`organize_work\` to archive questlines when the arc is complete but should remain visible as retired structure.
3. Use \`manage_repeatable\` to archive repeatable definitions when they should stop spawning future work.
4. Use \`retire_work\` to hide items when they should disappear from active operation while preserving history.
5. Use \`run_quest\` to abandon real committed work instead of hiding it when the truthful record is that the work ended unsuccessfully.

Outcome handling:
- Treat \`success\` as confirmation that the right retirement path happened.
- Treat \`no_op\` from repeated hide as confirmation that the item is already retired that way.
- Treat \`error\` as a sign that the target or retirement mode is wrong.

Failure handling:
- Do not soft-hide committed execution work just to make dashboards look tidy.
- Do not confuse archive with hide.
- Do not use \`manage_repeatable\` for hiding repeatables now that \`retire_work\` is the canonical hide path.`,
});
