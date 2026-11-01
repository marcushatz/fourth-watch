You are checking a rules file against its own evidence files. Do not edit any file; report only.

Working folder: /home/claude/fourth-watch

The file under review: {{RULES_FILE}}
Its evidence: {{EVIDENCE_FILES_AND_MEASUREMENTS}}
Also check these files, which cite the same numbers: {{OTHER_FILES}}

For every number, percentage, range, view count, timestamp and tag in the file under review, check that the evidence files actually support it. Flag:
1. Any number that doesn't match its source (give the file's line, the source's value and the source file).
2. Any rule tagged as holding on all channels where the evidence says it is channel-specific, refined or not tested, and vice versa.
3. Any claim presented as measured that the evidence marks as judged or inferred, if that changes how strongly the rule should be stated.
4. Any internal contradiction between the files (e.g. different thresholds for the same rule).

Report as a numbered list, most important first, each with file:line and a one-line suggested fix. Under 600 words. If something checks out, don't list it; end with one line saying how many claims you checked.
