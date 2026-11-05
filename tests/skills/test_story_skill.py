#!/usr/bin/env python3
"""Structure checks for the fourth-watch-story skill.

These confirm the skill is intact. They say nothing about whether it writes
better scripts. Only the test in evals/test_plan.md can show that.

Run: python3 tests/skills/test_story_skill.py
"""
import pathlib
import re
import unittest

REPO = pathlib.Path(__file__).resolve().parents[2]
SKILL_DIR = REPO / ".claude/skills/fourth-watch-story"
SKILL = SKILL_DIR / "SKILL.md"
REFS = SKILL_DIR / "references"
TRANSCRIPTS = REPO / "research/lintel_transcripts_all.md"
ALL_DOCS = [SKILL, *sorted(REFS.glob("*.md")), *sorted((SKILL_DIR / "evals").glob("*.md"))]
RUN_LENGTH = 8  # words in a row shared with a Lintel transcript


def words(text):
    return re.findall(r"[a-z0-9']+", text.lower().replace("’", "'"))


def frontmatter(text):
    match = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not match:
        return {}
    return dict(line.split(": ", 1) for line in match.group(1).splitlines() if ": " in line)


class StorySkill(unittest.TestCase):
    def test_frontmatter(self):
        meta = frontmatter(SKILL.read_text())
        self.assertEqual(meta.get("name"), "fourth-watch-story")
        self.assertTrue(0 < len(meta.get("description", "")) <= 1024)

    def test_does_not_replace_the_writer(self):
        description = frontmatter(SKILL.read_text())["description"]
        self.assertIn("fourth-watch-writer", description)
        self.assertIn("Use only when", description)
        self.assertTrue((REPO / ".claude/skills/fourth-watch-writer/SKILL.md").exists())

    def test_core_stays_concise(self):
        self.assertLess(len(SKILL.read_text().splitlines()), 200)

    def test_every_reference_is_linked_from_the_core(self):
        text = SKILL.read_text()
        for path in REFS.glob("*.md"):
            self.assertIn(f"references/{path.name}", text, path.name)

    def test_required_references_exist(self):
        for name in (
            "story-discovery", "emotional-storytelling", "structure-and-payoff",
            "annotated-scripts", "editorial-decisions", "scripture-integrity", "evaluation",
            "standing-rules",
        ):
            self.assertTrue((REFS / f"{name}.md").exists(), name)

    def test_standing_rules_cover_script_and_screen(self):
        text = (REFS / "standing-rules.md").read_text()
        self.assertIn("## Part 1: the script", text)
        self.assertIn("**Emotion**", text)
        self.assertIn("## Part 2: the screen", text)
        self.assertIn("## Open decisions for Marcus", text)
        core = SKILL.read_text()
        self.assertIn("Part 1 of `references/standing-rules.md`", core)
        self.assertIn("Part 2 of `references/standing-rules.md`", core)

    def test_repo_paths_exist(self):
        pattern = re.compile(r"`((?:[\w.-]+/)+[\w.-]+\.\w+)`")
        for doc in ALL_DOCS:
            for rel in pattern.findall(doc.read_text()):
                candidates = [REPO / rel, SKILL_DIR / rel, doc.parent / rel]
                self.assertTrue(any(c.exists() for c in candidates), f"{doc.name}: {rel}")

    def test_annotated_library_has_six_scripts(self):
        text = (REFS / "annotated-scripts.md").read_text()
        self.assertEqual(len(re.findall(r"^## \d+\. Strong:", text, re.M)), 3)
        self.assertEqual(len(re.findall(r"^## \d+\. Weak:", text, re.M)), 3)

    def test_plan_carries_the_screen_decisions(self):
        text = (REFS / "structure-and-payoff.md").read_text()
        for column in ("Narration", "Framing", "Timing", "Acting"):
            self.assertIn(f"| {column} |", text)

    def test_untested_work_is_labeled(self):
        self.assertIn("**UNTESTED.**", (SKILL_DIR / "evals/preliminary_walkthroughs.md").read_text())
        self.assertIn("not run", (SKILL_DIR / "evals/test_plan.md").read_text())
        self.assertIn("untested draft", SKILL.read_text())

    def test_no_copied_lintel_wording(self):
        source = words(TRANSCRIPTS.read_text())
        runs = {tuple(source[i:i + RUN_LENGTH]) for i in range(len(source) - RUN_LENGTH + 1)}
        for doc in ALL_DOCS:
            found = words(doc.read_text())
            for i in range(len(found) - RUN_LENGTH + 1):
                run = tuple(found[i:i + RUN_LENGTH])
                self.assertNotIn(run, runs, f"{doc.name}: {' '.join(run)}")


if __name__ == "__main__":
    unittest.main(verbosity=1)
