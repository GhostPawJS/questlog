# Protect Capacity And Focus

Primary tools:
- `review_questlog`
- `plan_quest`
- `run_quest`

Steps:
1. Use `review_questlog` to inspect active, in-progress, scheduled-now, or missed-scheduled load before committing more work.
2. If too much is scheduled or active at once, use `plan_quest` to rebalance timing instead of pretending everything can move now.
3. Use `run_quest` only for real execution progress once the load is honest.

Outcome handling:
- Treat dense scheduled-now or in-progress views as real capacity warnings.
- Treat empty views as signal too; do not manufacture urgency.

Failure handling:
- Do not stack new timing commitments on top of already impossible schedules.
- Do not use execution updates to hide planning overload.
- Do not confuse availability with realistic capacity.