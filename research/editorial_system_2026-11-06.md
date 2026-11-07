# The editorial system, Nov 6, 2026 (Round 74): what changed, and the first test

Marcus's brief: "Fourth Watch will focus on Bible storytelling that connects Scripture to the real struggles people experience in their everyday lives." Relate → Reveal → Transform is now the foundation. The philosophy is in `EDITORIAL.md`, and the process is in the `fourth-watch-writer` skill.

## 1. What changed and why

**Before.** Writing rules lived in about a dozen places, and they disagreed:
- the writer skill and its references;
- the `fourth-watch-story` draft;
- `system/01` to `03`;
- `production/03` and `10`;
- the Lintel studies;
- `fw_check.py`;
- the account copies of the writer and review skills.

The writer was built for investigations: a third-person question hook, at most 15% retelling, a new fact every 10 to 15 seconds, and at least three Value items. Its own "Start here" note already overrode half of those rules. The story draft had moved toward stakes and emotion but stayed untested. The checker still failed any script that didn't use the five investigation sections or that ended on a question.

| Change | Files | Why |
|---|---|---|
| One philosophy file, read first by every writing skill and listed in `CLAUDE.md` | `EDITORIAL.md`; `CLAUDE.md` section 6 | So the philosophy persists across sessions and conflicts have one place to resolve |
| The writer rebuilt as one concise process. Each step leaves a file, and each has a short written gate | `fourth-watch-writer/SKILL.md`, `templates.md` | Enforceable without being formulaic: the gates ask for evidence in words, not counts |
| The nine-field idea card replaces the seven-question card and the angle card | `templates/idea_card.md`; `angle_card.md` removed | His section 8 |
| One set of claim labels, merging the writer's and the story draft's integrity rules, plus new traps (Genesis 3:9 "to the man", God's motive stated as fact, Elijah, the prodigal son) | `reference/verification.md` | His section 6 |
| What counts as a reveal, mapped to his nine kinds of value, with Relate and God added to the strength test | `reference/discoveries.md` | His section 3 |
| Every settled conflict recorded, with his Round for each | `reference/retired_rules.md` | His section 10: "Resolve conflicts between older writing rules" |
| The checker learned the FOURTH WATCH format: free sections, required message, relate, reveal and transform lines, and warnings for more than three spoken questions, empty phrases, feeling-tells and stock phrases. Ending on a question is now a warning, and the AI judge reminder is gone. The older series keep their checks | `fw_check.py`; 7 new fixtures; all 22 pass | A script can't pass on structure, and the mechanical checks now match his writing principles |
| The story draft and the create skill point to `EDITORIAL.md`, and create's stage 1 uses the writer | Story `SKILL.md`, `standing-rules.md`, `editorial-decisions.md`, `test_plan.md`; create `SKILL.md` | One live process. The story draft stays available by name |
| The channel identity and script requirements were updated, and older guides were marked as research | `production/README.md`, `03`, `10`; `system/00`; banners on `system/01` to `03`, `research/script_rules_from_hits.md`, `master_scriptwriting.md`; `prompts/` | So no old file quietly contradicts the new one |

**Kept unchanged:**
- ESV-only quotes, fetched each session;
- the link test;
- no invented dialogue, motives or inner life;
- one clear message;
- plain speech on one listen;
- no stock phrases, and no follow ask;
- the screen rules;
- locked scripts.

**Not changed, and needing his decision:**
- **The story-skill test plan predates this.** It now needs re-scoping, or dropping.
- **The account copies** of `fourth-watch-writer` and `fw-script-review` are still the old versions. Updates were proposed for him to save.

## 2. The first test: five episode concepts

Every quote below was checked against the ESV on Nov 6, in short excerpts: esv.org, and bible.com for 1 Samuel 24 and Luke 15.

### A. Elijah: the collapse after the win
- **Pillar:** anxiety, fear and uncertainty.
- **Struggle:** you finally get through something huge, and right after it you fall apart, exhausted, afraid and sure you're alone.
- **Passage:** 1 Kings 19:1-18. Supporting: 18:38 (Carmel), 19:19-21 (Elisha).
- **Hook:** "Right after the greatest victory of his life, Elijah ran into the desert and told God, 'It is enough.'"
- **Insight:**
  - God's first response isn't a correction or a sermon. An angel touches him, food and water are by his head, he sleeps, and it happens again: "Arise and eat, for the journey is too great for you" (19:7). God names Elijah's limit before he gives him a task (TEXT for the order, INFERRED for its meaning).
  - Then God answers the story Elijah is telling himself, "I, even I only, am left" (19:10), with seven thousand who had not bowed to Baal (19:18), and names Elisha to take his place (19:16).
- **Practical connection:** when you're depleted, rest and food can be the faithful next step, not a failure. And "I'm the only one" may not be true, because God answered it with people.
- **Accuracy concerns:**
  - Don't diagnose Elijah.
  - 19:4 is a wish to die ("take away my life"). Keep the text's words, don't dramatize it, and get a pastoral read before production.
  - The ESV has "the sound of a low whisper" (19:12), not "still small voice", and it doesn't teach that God always speaks quietly.
  - "What are you doing here?" (19:9, 13) has several readings, so don't state that it's a rebuke.
  - Obadiah's hundred hidden prophets (18:13) could sharpen "I only am left", but Elijah may mean something narrower. Treat that as INFERRED at most.

### B. Joseph: forgiving without pretending it was fine
- **Pillar:** relationships, rejection and betrayal.
- **Struggle:** someone close hurt you badly, and "just forgive them" sounds like pretending it didn't matter.
- **Passage:** Genesis 37:26-28; 44:18-34; 50:15-21.
- **Hook:** "The brother who sold Joseph into slavery later begged to become a slave himself."
- **Insight:**
  - Judah, who proposed selling Joseph ("Come, let us sell him to the Ishmaelites," 37:27), offers to "remain instead of the boy as a servant" (44:33). The brothers have changed.
  - When they ask, "Please forgive the transgression of your brothers" (50:17), Joseph never says the word "forgive" in his reply. Instead he names it plainly: "you meant evil against me, but God meant it for good" (50:20). Then "he comforted them and spoke kindly to them" (50:21).
- **Practical connection:** forgiveness doesn't require calling the wrong small. You can call it evil and still refuse revenge. Trust is rebuilt by evidence of change, which is a different thing.
- **Accuracy concerns:**
  - Genesis never says why Joseph tested them.
  - "He never says 'forgive'" must not become "he didn't forgive them", because 50:21 shows his response.
  - The forgiveness-versus-reconciliation line is our application (INTERPRETATION).
  - The story covers 13 chapters, so there's a real risk of compressing them or getting the order wrong.

### C. Gideon: when God calls you something you don't feel
- **Pillar:** identity and self-worth.
- **Struggle:** feeling unqualified when someone sees more in you than you do.
- **Passage:** Judges 6:11-16. Supporting: 6:36-40, 7:2.
- **Hook:** "The angel called him a mighty man of valor while he was hiding his wheat in a winepress."
- **Insight:**
  - Gideon answers with his résumé: "my clan is the weakest in Manasseh, and I am the least in my father's house" (6:15). God doesn't argue with it. He answers with his presence: "But I will be with you" (6:16).
  - Later God shrinks the army so Israel can't boast (7:2).
- **Practical connection:** the question shifts from "am I enough?" to "who is with me?"
- **Accuracy concerns:**
  - Whether "mighty man of valor" (6:12) is a description, a promise or irony is debated.
  - The fleece is neither a model nor a sin in the text, so no lessons on discerning God's will.
  - Originality risk: this is one of the most preached openings in Judges.

### D. David in the cave: when the chance to get even sounds like God's will
- **Pillar:** temptation and self-control; relationships and betrayal.
- **Struggle:** someone has treated you unfairly for a long time, you finally have the chance to get back at them, and everyone says you deserve it.
- **Passage:** 1 Samuel 24 (compare 26).
- **Hook:** "The king hunting David walked into the cave where he was hiding, and David's men said God had arranged it."
- **Insight:**
  - The temptation comes in religious language: "Here is the day of which the LORD said to you" (24:4).
  - David cuts only the corner of the robe, and even that troubles him: "afterward David's heart struck him" (24:5). He won't harm "the LORD's anointed" (24:6). An opportunity isn't permission.
- **Practical connection:** when a chance to retaliate feels "meant to be", ask whether it's right, not just whether it's available. Small revenge counts too.
- **Accuracy concerns:**
  - I haven't confirmed whether any earlier chapter records God saying what the men quote. Check 1 Samuel 16 to 23 before claiming he never said it.
  - "The LORD's anointed" must not become "never resist any authority".
  - Don't merge it with chapter 26.

### E. The older brother: doing everything right and feeling overlooked
- **Pillar:** failure, shame and restoration (and feeling overlooked).
- **Struggle:** you did everything right for years, and the one who didn't gets the celebration.
- **Passage:** Luke 15:1-2, 11-32.
- **Hook:** "Everyone remembers the son who ran away. Jesus' story ends with the one who stayed, standing outside the party."
- **Insight:**
  - Jesus tells it to grumbling Pharisees and scribes (15:1-2).
  - The father goes out to both sons. He runs to one (15:20), and to the other, "his father came out and entreated him" (15:28).
  - The son who stayed says, "Look, these many years I have served you" (15:29). The father answers, "Son, you are always with me, and all that is mine is yours" (15:31).
  - The story ends without saying whether he goes in.
- **Practical connection:** you can be near the Father and still resent his grace to someone else, and the invitation is for the one who stayed, too.
- **Accuracy concerns:**
  - It's a parable, and the narration must say so.
  - "A running father was shameful in that culture" is a debated historical claim, not text.
  - Don't supply the ending Jesus left open.
  - Originality risk: the older-brother reading is widely preached.

### The strongest: Elijah

It's the one concept where all three parts are strong and none needs a stretch.

- **Relate:** exhaustion after effort, and the feeling of being the only one, are widely recognized, inside the church and outside it. That's the audience he named.
- **Reveal:** two details most viewers have never noticed, and both are plain TEXT:
  - God starts with sleep, food and "the journey is too great for you", in that order;
  - "I only am left" is answered with seven thousand, and with Elisha.
- **Transform:** it shows something true about God, that he meets exhaustion with care before any task and tells the truth about our isolation. It also gives a concrete, non-generic application.
- **Narrative:** one chapter with a clear arc. He runs, collapses, is cared for, climbs the mountain, hears the whisper, is corrected and is given a successor.
- **Production:** a small cast and strong pictures: the broom tree, the food by his head, the cave, the wind, earthquake and fire, the cloak. It suits the stickman look.
- **Risk:** 19:4 needs care and a pastoral read.

Joseph is a close second, with the richest insight, but its thirteen chapters are hard to tell honestly in two minutes.

**What the test showed about the method:**
- The uncertainty field caught two claims that would have sounded great and might not hold: David's "God never said that", and the "shameful running father".
- The originality question demoted Gideon despite its hook.

## 3. The Genesis episode under the new philosophy

`ep11-beginning/script_approved.md` (v11) is locked, and this review doesn't change it.

### What already works

- **Transform is its strongest part.**
  - "He didn't make us because he needed us. He made us because he wanted us." is a clear statement about God.
  - "So when we fail, we don't have to hide from him." is a specific, usable application.
  - The closing question has one good answer and accuses no one.
- **Two genuine reveals, both TEXT:**
  - God's first recorded words after the fall are a question, "Where are you?" (3:9);
  - he makes them clothes (3:21) before he sends them out (3:23).
- **It keeps the judgment in:** "There are consequences. They will die."
- **It names its passages,** and quotes the ESV exactly where it quotes.

### Where it falls short of the new standard

1. **It lectures before it tells the story.** The first quarter is an argument from Acts 17:25 and Revelation 4:11, plus two "easy answers". The storyboard's first story shot is at 31 s. The new method brings viewers into the narrative first.
2. **Relate is split, and it's abstract at the start.** The opening question is theological, and "we all want to feel needed" is the only relatable line before the story. The second struggle, hiding after failing, is the stronger one, and it only appears at the end.
3. **It leaves out Adam's own answer.** Marcus's example names Genesis 3:10: "I was afraid... and I hid myself." That's the most relatable line in the passage, and the script doesn't use it.
4. **It states God's motive as fact (integrity).** "He already knew where they were. He didn't need an answer. He wanted them." This is the exact case his brief describes. The script can investigate the question, but it must say "he wanted them" as our reading, not as the text.
5. **"To them" (accuracy).** Genesis 3:9 says God "called to the man and said to him". The script says "he calls out to them" and "God's first words to them". The proposed fix is "to Adam" in both lines.
6. **Five spoken questions, and a withheld answer.** "We'll come back to what he said" is a suspense device, and the brief warns against artificial suspense. The checker now flags more than three spoken questions.
7. **"How could you?" is our phrase,** set beside God's real words. It reads clearly as a contrast, but the checker flags it as unreferenced quoted words.

### Proposed fixes

Only if he unlocks it, and these are for him to decide:
- 5 and 4, before the voice is recorded, because they're accuracy issues;
- 1 to 3 only if he wants the episode rebuilt toward the new philosophy. That's a bigger change, and it's his call, because the script is approved and the storyboard is built on it.
