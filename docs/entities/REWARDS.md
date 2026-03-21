# Rewards

## What They Are

Rewards are descriptive acknowledgements attached to work.

They let an operator record what a quest yielded after successful completion:
points, credits, badges, symbolic recognition, or any other app-specific reward
shape. Questlog stores and tracks them, but does not interpret them as game
mechanics by itself.

## Why They Exist

Rewards are separate from quest state because:

- a quest may finish successfully without any reward at all
- one quest may yield several rewards
- claiming a reward can be a separate event from finishing the quest
- recurring work needs future reward defaults without rewriting historical quests

## How To Use Them

Use rewards when the operator wants to say:

- "this completed work should grant something"
- "I want to record what was earned"
- "claiming the reward should be tracked separately"

Typical flow:

1. Attach rewards to a concrete quest, or define them on a repeatable template.
2. Complete the concrete quest successfully.
3. Claim the concrete reward when it is actually granted or taken.

## Good Uses

- XP, points, credits, or bounty
- badges, tokens, or streak artifacts
- recognition like `published`, `approved`, or `shipped`
- measurable outputs like hours banked or credits earned

## Do Not Use Them For

- the main meaning of the quest
- dependencies or blocking logic
- classification and filtering
- anything that should happen before the quest is complete

That is what quests, unlocks, and tags are for.

## Under The Hood

Rewards span two tables because Questlog distinguishes between concrete truth and
future defaults:

- `quest_rewards`: rewards attached to concrete quest instances
- `repeatable_quest_rewards`: reward templates copied into future spawned quests

That split exists so operators can change future recurring defaults without
rewriting rewards that were already attached to past spawned quests.

## Public APIs

### Writes

- `addQuestReward(db, questId, input)`: attach one reward to a concrete quest.
- `updateQuestReward(db, rewardId, input)`: change an unclaimed concrete reward.
- `removeQuestReward(db, rewardId, now?)`: soft-delete an unclaimed concrete reward.
- `claimQuestReward(db, rewardId, claimedAt?)`: claim a concrete reward after successful completion.
- `replaceRepeatableQuestRewards(db, repeatableQuestId, rewards, now?)`: replace the future reward template set for a recurring quest.

### Reads

- There is no dedicated reward read surface.
- Rewards are surfaced through richer quest reads such as `getQuestDetail()`.
