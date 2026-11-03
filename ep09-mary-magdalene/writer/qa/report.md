# Fourth Watch QA — script

**Verdict: PASS WITH WARNINGS** · 0 fail · 9 warn · 8 pass

| Fact | Value |
| --- | --- |
| title | Why did Jesus appear first to Mary Magdalene? |
| series | ASK THE TEXT |
| VO words | 205 |
| estimated runtime | 72.4s at 170 wpm |

| Level | Check | Time | Finding |
| --- | --- | --- | --- |
| WARN | runtime |  | estimated 72s; target 85–135s for ASK THE TEXT |
| WARN | overclaim |  | 'all' — make sure the text really says this: 'She thinks someone has taken his body, and now that's all she wants.' |
| WARN | overclaim |  | 'never' — make sure the text really says this: 'So why her? John never gives a reason. He only tells us this.' |
| WARN | overclaim |  | 'only' — make sure the text really says this: 'So why her? John never gives a reason. He only tells us this.' |
| WARN | loop |  | the last VO line shares no key word with the hook; the loop line should echo it |
| WARN | turn |  | the Turn starts about 25s in (Lintel's top six turn at 14–25 s, after at most ~14 s of story) |
| WARN | answer timing |  | the core answer starts at about 68% of the runtime (top six 33–50%; the question-video lows 59–82%) |
| WARN | echo |  | the hook never comes back after 70% of the runtime (14% of its key words in one line). All three hits re-ask it in its own words at 82–89%, then answer it in one line |
| WARN | judge |  | not judged: run the blind judge panel before Marcus sees it, then pass --judge <run folder> (tools/script_judge/rubric.md) |
| PASS | series |  | ASK THE TEXT |
| PASS | hook |  | first VO line equals the title |
| PASS | answer |  | answer stated in the Turn/Landing: 'She didn't know him when she saw him. She knew him when he said her name.' |
| PASS | value |  | 3 things the viewer learns, each with a verse and each said in the VO |
| PASS | story share |  | the Story section is 15% of the words (Marcus's cap ~40%; the hits retell 0–5%, the top six spend 0–21% on any story). Count story lines in other sections by hand |
| PASS | you lines |  | 0 sentences speak to 'you' outside quotes (top six 1–3; the reels with 5–9 were all lows). Never describe the viewer's conduct |
| PASS | repetition |  | no 3-word phrase is said 3 or more times |
| PASS | nothing new |  | every line adds at least one new key word or quote |
