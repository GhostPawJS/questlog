# Concept: GhostPaw Questlog

## Diagnosis
The owner reviewed the live paper page on 2026-10-24 and rejected the visual direction across the GhostPaw site: paper cards, ink and rubber stamps read as an office archive, not as GhostPaw. What stays strong: the board replayed from a real questlog 0.5.1 run, the refusal text, the honest notes about blocked being a view, the TODO.md mapping and the numbers. What changes: palette, type, form, imagery and motion move to the shared dark spectral identity; quest cards become lit panes and stamps become glowing status tags.

## Voices
- The complaint that defines the category: the agent said it was done, and it was not. V002 V006 V019 V034 V036 V037
- People build second reviewers, hooks and runnable specs just to check a "done". V001 V019 V036 V045 V060 V061
- The common task store is a TODO.md with three headings, Todo, Doing and Done, or a DONE.md and HANDOFF.md beside it. V017 V025 V026 V044
- Work gets forgotten in place: the same lead tops the list four nights running, backlog work prompted on Saturday is still untouched on Monday. V008 V012 V013
- Dependencies are not enforced: a teammate claimed a task whose blocker was still open; claiming is not atomic. V038 V039 V010
- Heartbeats and scheduled jobs report success without doing the work in HEARTBEAT.md. V040 V042 V009
- Sessions lose track of which task they are on. V035 V041 V046
- Agent issue trackers draw scorn for size: Beads at 240,000 lines; the measured context saving was small. V028 V029 V062
- Todo lists outgrow files and move to real trackers. V050 V049 V053
- Creators explain the shift from to-do lists to task lists with dependencies. V063 V066 V067 V065

## Buyer
A Node.js developer whose agent keeps its work in TODO.md, PROGRESS.md or HEARTBEAT.md and who has been burned by a "done" that was not (V025 V006 V040). They come from a thread about agents grading their own homework or from the GhostPaw home page, compare against the markdown file, Beads, Backlog.md and Claude Code's own task list (V030 V059 P001 P003), and need to believe the store will refuse a hollow finish and keep blocked work blocked (V019 V038). The hesitation most likely to stop them: agent task trackers become huge (V028 V029), so size and dependencies sit next to the claim.

## Decision path
1. Is this the "said it was done" problem? → hero names it and shows a quest that cannot finish without a written outcome.
2. How is it different from TODO.md? → the board: the same three headings become quests whose state is derived, and finishing one unlocks the next.
3. What about deadlines and recurring work? → due soon, overdue and repeatable quests on the same board (RRULE).
4. Is it small? → 0 runtime dependencies, Node 24+, 352 tests, 42.1 KB gzip, about 4.6 ms import.
5. How do I start? → install line, quick start code, GitHub and the live demo.

## Mechanism
Chosen: a quest board with four quests from the README example (Vendor Renewal). The visitor starts and finishes quests; the Finish button needs an outcome line and refuses an empty one with questlog's own message ("Quest outcome must not be empty."); finishing "Collect redlines" unlocks the blocked quest; a "+7 days" switch shows due soon and overdue. Speed: the board is visible on load with markers already set; proof: every rule mirrors the library source and the exact call shows under each move; effort: two taps; honesty: labelled as a browser walk-through of the documented rules, the live demo linked for the real library; share value: low, so the share card carries the headline.
Rejected: a kanban drag board: it is the visual every peer already has (P005 P011) and drag-to-Done is exactly the hollow finish voices complain about.
Rejected: a comparison table against Beads and Backlog.md: claims about other projects, and size is better shown as our own number.
Rejected: a scheduled-run demo: needs a server and a clock; only text would remain.

## Offer
Product: @ghostpaw/questlog, an open-source task and calendar engine for Node.js on SQLite
Price: free, MIT licence
Delivery: `npm install @ghostpaw/questlog` into a Node.js 24+ project; tables are created in a node:sqlite database the caller opens

## Facts
- questlog 0.6.2 is on npm with zero runtime dependencies and requires Node.js 24+ for node:sqlite. https://www.npmjs.com/package/@ghostpaw/questlog
- Seven concepts: rumor, questline, quest, repeatable quest, unlock, reward, tag. https://github.com/GhostPawJS/questlog
- finishQuest takes an outcome string and throws "Quest outcome must not be empty." on a blank one. https://github.com/GhostPawJS/questlog/blob/main/src/assert_non_empty.ts
- A resolved quest cannot be resolved again or restarted. https://github.com/GhostPawJS/questlog/blob/main/src/quests/resolve_quest.ts
- An unlock keeps quest B out of listAvailableQuests and in listBlockedQuests until quest A resolves with success; the run_quest tool refuses to start a blocked quest with invalid_state naming the blockers unless force is true (0.6.0); the library startQuest does not check unlocks. https://github.com/GhostPawJS/questlog
- Markers are plain symbols from the markers namespace: "!" available, "?" incomplete (in progress or blocked), "?" turn-in pending; a done quest without a reward has no marker. https://github.com/GhostPawJS/questlog
- The board on the page replays a real run of questlog 0.6.2 on 2026-10-24 with a fixed clock: the empty-outcome error, the run_quest refusal on the blocked quest, the unlock, due soon and overdue at +7 days. https://github.com/GhostPawJS/questlog#quick-start
- Availability, blocking, deferral and overdue are derived at read time, never stored as flags. https://github.com/GhostPawJS/questlog
- A deadline is a quest with dueAt; a calendar event is a quest with a scheduled start and end; repeatable quests use RRULE. https://github.com/GhostPawJS/questlog
- Twelve tools for agents, among them review_questlog, capture_rumor, shape_work, run_quest and reward_work. https://github.com/GhostPawJS/questlog
- 352 tests with 95.98% line, 87.91% branch and 96.35% function coverage, measured 2026-10-24. https://github.com/GhostPawJS/questlog
- dist is 42.1 KB gzip and imports in about 4.6 ms on the maintainer box, measured 2026-10-24. https://github.com/GhostPawJS/questlog
- A TODO.md with three headings, Todo, Doing and Done, is a common agent task store. V025

## Axes
| Axis | Market | Voices | Chosen |
| --- | --- | --- | --- |
| Opening | "team of agents", "structure for AI", "really does things" P002 P004 P012 | "said it was done", "grade its own homework" V002 V006 V019 | open on the hollow done and the outcome line that stops it |
| Proof | stars, waitlists, app screenshots P001 P004 P011 | wants evidence and enforced blockers V019 V038 | the board refuses what the library refuses; measured numbers |
| Mechanism | MCP server, CLI or hosted app P006 P007 P008 | keeps TODO.md and HEARTBEAT.md files V025 V040 | a quest board with outcome-gated finish and unlocks |
| Palette | white or black with one accent P002 P004 P006 | watches agents and dependency graphs in the terminal V062 V065 | near-black void, spectral cyan for available, wraith violet for in progress, alarm rose for blocked, overdue and refusals, ward green for done |
| Imagery | screenshots or none P001 P003 P008 | films task graphs drawn in the terminal V065 V062 | generated spectral line art: a ghost paw pressing a hexagonal "!" marker, a dependency graph of hex nodes; the rest is the live board in HTML |
| Tone | bold claims P004 P012 | tired of agents claiming success V034 V037 | plain, states what it refuses |

## Sparks
- "Said it was done": the finish nobody checked. V002 V006 V019 V034
- TODO.md with Todo, Doing, Done. V025 V026 V017
- The blocker that was still open. V038 V039
- The same item on top of the list, night after night. V008 V013

## Directions
1. Agent team: hero says your agents become a team that ships while you sleep. V007 → struck: first direction; it is the market opening (P004 P011).
  pushed: a dashboard of busy agents; any peer drops in.
2. Kanban board: drag cards from Todo to Done. V025 → struck: second direction; peers already show boards (P005), and drag-to-Done is the hollow finish.
  pushed: animated lanes; same picture, nicer.
3. Outcome-gated board: quests finish only with a written outcome and blocked quests stay blocked until their prerequisite succeeds. V019 V038 V006 → struck: built as paper cards with rubber stamps, then rejected on owner review on 2026-10-24; the board survives inside direction 9.
  pushed: the Finish button holds an outcome field; finishing one quest lifts the stamp off the next; time jumps a week to show overdue.
4. TODO.md converter: paste a TODO.md and see it become quests. V025 V026 → struck: needs parsing guesses and a real library call the browser cannot make.
  pushed: kept as the board's starting text, three headings mapped to states.
5. Heartbeat log: a cron log where one run claims success and questlog shows it unfinished. V040 V042 → struck: depends on a scheduler questlog does not ship.
  pushed: mentioned as a use in the plain notes.
6. Receipt printer: each finished quest prints a receipt with its outcome. V045 → struck: a theme any task tool could wear.
  pushed: the outcome line keeps a receipt edge.
7. Quest log game screen: full RPG styling with gold and XP. V063 → struck: merely playful; the voices are tired, not looking for a game.
  pushed: only the plain marker symbols "!" and "?" remain, as the markers namespace prints them.
8. Plain README page. V017 → struck: matches the market baseline (repo pages P001 P003 P008).
  pushed: the README stays one click away.
9. Lit board: the same outcome-gated board on a dark scope; each quest is a pane lit by its state, the blocked tag on #3 glows alarm rose until #1 finishes with an outcome, then dissolves. V019 V038 V065 → chosen
  pushed: the GhostPaw paw presses the "!" marker in the hero art; markers stay the plain "!" and "?" the library prints, no game styling (direction 7 stays struck).

## Concept
Done needs an outcome, on a dark scope. The page centres on a small quest board taken from the README's Vendor Renewal example. Each quest is a lit pane with questlog's markers: "!" available in spectral cyan, "?" incomplete while in progress or blocked. Pressing Finish opens an outcome line; leave it blank and the pane answers with the library's own refusal in alarm rose, "Quest outcome must not be empty." (V019 V006). Write one and the pane turns ward green with its outcome, and the quest that waited on it loses its glowing "blocked" tag and joins the available list (V038). A switch jumps seven days: a due date turns overdue in alarm rose (V008 V013). Under every move the exact call appears, the way developers watch task graphs in a terminal (V065). The TODO.md with three headings (V025) is the before, shown as plain text beside the mapping.

## Spine
1. Hero: "Your agent said it was done. Was it?" Subline: questlog will not finish a quest without a written outcome and keeps blocked work blocked; install line, GitHub, live demo; a "0 runtime dependencies" readout; generated art of a ghost paw pressing the "!" marker. V002 V006 V019
2. The board: four quests, Finish with outcome, unlock, +7 days; the call under each move. V038 V008
3. From TODO.md: the three headings mapped to derived states, plus rumors for work not yet shaped. V025 V026 V044
4. Deadlines and repeats: dueAt, scheduled windows, RRULE repeatable quests. V009 V040
5. Numbers: 0 runtime deps, Node 24+, 352 tests, 96.0% lines, 42.1 KB gzip, about 4.6 ms import, 12 tools. V028 V029
6. Start: install, quick start, GitHub, README, live demo, back to GhostPaw home.
7. Footer: Impressum, Datenschutz.

## Palette
| Role | Color | Source |
| --- | --- | --- |
| void | #04070b | the night behind the ghost; the owner asked for a deep near-black ground, and every peer page is white or stone P002 P004 P006 |
| panel | #0a1119 | a terminal pane one step above the void; creators film agents in terminals V062 V065 |
| rule | #1d2c3c | pane borders and the faint HUD grid |
| ghost | #e3edf5 | spectral white for body text, cold not cream |
| haze | #93a5b9 | secondary text, the glow a ghost leaves |
| spectral | #62e6f2 | the ghost's cold cyan: primary actions, available, measured values |
| wraith | #b39dff | the afterglow: in progress, superseded, structure lines |
| alarm | #ff7aa6 | flags, refusals, blocked and overdue |
| ward | #7af0b4 | confirmed and done |

## Type
| Role | Family | Source |
| --- | --- | --- |
| display | Tektur, Bahnschrift, Arial Narrow, sans-serif | a squared, width-variable display face that reads like HUD lettering and stretches from condensed tabs to wide headlines; one family carries the GhostPaw name |
| body | system-ui, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif | the reader's own interface sans, which stays readable in long paragraphs on a dark ground and costs no download, so the two loaded faces carry the identity |
| code and file names | Martian Mono, Cascadia Mono, Consolas, monospace | crisp, slightly narrow mono for install lines, calls and file names like MEMORY.md V025 |

## Form
Quests are panes: panel ground, 1px rule border, a 12px chamfer on the top right corner and a 3px top bar lit by state (cyan available, violet in progress, rose blocked, green done). No drop shadows. Status tags are small outlined labels with a faint fill of their color; nothing is rotated. One column on phones with the call log below the board; on desktop three panes side by side with the TODO.md text beside its mapping. The page ground carries the shared faint 48px grid.

## Imagery
| Image | Job | Art direction | Source |
| --- | --- | --- | --- |
| hero paw on marker | protagonist | a ghost paw drawn in cyan light filaments pressing a glowing hexagonal "!" marker, violet sparks, on pure black; no people, no logos V065 V062 | generated |
| dependency graph | explanation | hex nodes joined by light lines: lit cyan nodes, a locked violet node, faint nodes beyond, on pure black; what unlocks look like V065 V038 | generated |
| share card | share preview | the hero art with the headline in the display face at 1200×630 | generated art, rendered from HTML |

## Motion
Moment: on first load a single cyan scan line sweeps down over the hero art once (900 ms) and the art resolves behind it.
Feedback: when a quest finishes, the "blocked" tag on the next quest dissolves upward (300 ms); a blank outcome shakes the field 4px once and shows the refusal; the chosen toolbar state glows.
Reduced motion: no sweep, shake or dissolve; text and tag states change in place.

## Copy
- Use: "said it was done", "outcome", "blocked", "overdue" V002 V006 V038
- Show TODO.md as a file name in code, never as a bare word, so it does not read as a placeholder. V025
- Use: "grade its own homework" V002
- Avoid: "team of agents", "really does things", "sanity for you" P002 P004 P012
- Avoid: "autonomous", "set it and forget it", "ships while you sleep" V066
- Plain, second person, short sentences; state limits: Node 24+, no scheduler or hosted service, an outcome line is text and not a test; since 0.6.0 the run_quest tool (and the MCP server and CLI on top of it) refuses to start a blocked quest unless force is true, while the library startQuest stays permissive. V019 V045 V038
- Never present voices as customers; describe what developers report in our words. V034 V036

## Changelog
- 2026-10-24: questlog 0.6.2 on npm (same dist apart from version and homepage). Refusal and forced-start warning re-run against 0.6.2; kicker, intro and JSON-LD version bumped; numbers stay from the v0.6.1 measurement and say so.
- 2026-10-24: questlog 0.6.1. Real run repeated against 0.6.1 (same lists and errors); #3 gets a "Start with run_quest" button that replays the tool's invalid_state refusal; the blocked note now says the tool refuses unless force is true while startQuest stays permissive; MCP install line added; numbers remeasured (352 tests, 42.1 KB gzip, 4.6 ms import).
- 2026-10-24: visual rebuild after owner review: paper cards and stamps replaced by the shared dark spectral identity (void, spectral cyan, wraith violet, alarm rose, ward green; Tektur, system sans, Martian Mono; generated paw-on-marker and dependency-graph art). Board replay, refusals, numbers and copy rules kept; direction 3 struck and direction 9 chosen.
- 2026-10-24: TODO.md moved from the Use phrases to a code-only rule; the bare word reads as a placeholder.
- 2026-10-24: page moved to /agent-tasks/; numbers from EXCELLENCE.md (96.0% lines, 4.4 ms import); markers as plain "!" and "?"; blocked described as a read-side view after a real run showed startQuest does not check unlocks.
- 2026-10-24: first concept from the batch of 2026-10-24 (67 voices, 12 peers).
