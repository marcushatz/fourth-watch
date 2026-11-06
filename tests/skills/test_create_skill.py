#!/usr/bin/env python3
"""Checks for the fourth-watch-create skill.

These confirm the files, the storyboard check and the motion maths work. They can't show that the
videos will be good, and they don't build anything in Higgsedit.

Run: python3 tests/skills/test_create_skill.py
"""
import copy
import importlib.util
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest

REPO = pathlib.Path(__file__).resolve().parents[2]
SKILL_DIR = REPO / ".claude/skills/fourth-watch-create"
SKILL = SKILL_DIR / "SKILL.md"
REFS = SKILL_DIR / "references"
TEMPLATES = SKILL_DIR / "templates"
EXAMPLE = TEMPLATES / "storyboard_example.json"

spec = importlib.util.spec_from_file_location("check_storyboard", SKILL_DIR / "scripts/check_storyboard.py")
board_check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(board_check)


def node(code):
    run = subprocess.run(["node", "--input-type=module", "-e", code], capture_output=True, text=True, timeout=30)
    if run.returncode:
        raise AssertionError(run.stderr)
    return json.loads(run.stdout)


def example():
    return copy.deepcopy(json.loads(EXAMPLE.read_text()))


class Structure(unittest.TestCase):
    def test_frontmatter(self):
        text = SKILL.read_text()
        self.assertIn("name: fourth-watch-create", text)
        description = re.search(r"^description: (.*)$", text, re.M).group(1)
        self.assertLessEqual(len(description), 1024)

    def test_every_reference_is_linked(self):
        text = SKILL.read_text()
        for path in REFS.glob("*.md"):
            self.assertIn(f"references/{path.name}", text, path.name)

    def test_paths_exist(self):
        pattern = re.compile(r"`((?:[\w.-]+/)+[\w.-]+\.\w+)`")
        for doc in [SKILL, *REFS.glob("*.md"), TEMPLATES / "README.md"]:
            for rel in pattern.findall(doc.read_text()):
                if "<" in rel or rel.startswith(("frames/", "fonts/", "types/")):  # these exist per episode or inside Higgsedit
                    continue
                places = [REPO / rel, SKILL_DIR / rel, doc.parent / rel, REPO / "ep02-bronze-serpent/source" / rel, REPO / "production" / rel]
                self.assertTrue(any(p.exists() for p in places), f"{doc.name}: {rel}")

    def test_no_pointers_to_deleted_code(self):
        for doc in SKILL_DIR.rglob("*"):
            if doc.suffix in (".md", ".py", ".js", ".jsx", ".json"):
                self.assertNotRegex(doc.read_text(), r"film27|engine_v11|engine_lab|shotlist_check", doc.name)

    def test_the_safeguards_are_stated(self):
        text = SKILL.read_text()
        for phrase in ("tools/production_lock.py", "Never", "Publish", "Silence isn't approval", "Marcus tweaks and approves the storyboard"):
            self.assertIn(phrase, text)

    def test_status_is_honest(self):
        self.assertIn("It hasn't made a video yet", SKILL.read_text())
        self.assertIn("haven't been built in Higgsedit", (TEMPLATES / "README.md").read_text())


class StoryboardCheck(unittest.TestCase):
    def fails(self, board, script=None):
        return board_check.check(board, script)[0]

    def warns(self, board):
        return board_check.check(board)[1]

    def test_example_passes(self):
        fails, warns = board_check.check(example())
        self.assertEqual(fails, [])
        self.assertEqual(warns, [])

    def test_words_must_match_the_script(self):
        board = example()
        script = board_check.tokens(" ".join(s["words"] for s in board["shots"]))
        self.assertEqual(self.fails(board, script), [])
        changed = list(script)
        changed[3] = "swam"
        self.assertTrue(any("differ from the script" in f for f in self.fails(board, changed)))

    def test_verse_references_are_ignored_in_a_script(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "script.md"
            path.write_text('# Title\nseries: X\n\n## Hook\nVO: Peter walked on water. [Matthew 14:29]\nON-SCREEN: WORDS\nVO: "Come."\n')
            self.assertEqual(board_check.script_words(path), ["peter", "walked", "on", "water", "come"])

    def test_empty_field_fails(self):
        board = example()
        board["shots"][1]["acting"] = ""
        self.assertTrue(any("'acting' is empty" in f for f in self.fails(board)))

    def test_short_shot_fails_unless_a_transition(self):
        board = example()
        board["shots"][0]["end"] = 0.6
        board["shots"][1]["start"] = 0.6
        board["shots"][0]["beats"] = []
        self.assertTrue(any("under 1 s" in f for f in self.fails(board)))
        board["shots"][0]["transition"] = True
        self.assertFalse(any("under 1 s" in f for f in self.fails(board)))

    def test_gap_between_shots_fails(self):
        board = example()
        board["shots"][1]["start"] = 4.8
        self.assertTrue(any("gap or overlap" in f for f in self.fails(board)))

    def test_big_move_needs_a_job(self):
        board = example()
        board["shots"][0]["move_job"] = ""
        self.assertTrue(any("needs a job" in f for f in self.fails(board)))

    def test_dead_stretch_fails(self):
        board = example()
        board["shots"][2]["end"] = 18
        board["shots"][2]["beats"] = []
        self.assertTrue(any("with no change" in f for f in self.fails(board)))

    def test_long_tail_fails(self):
        board = example()
        board["last_word_end"] = 6
        self.assertTrue(any("past the last word" in f for f in self.fails(board)))

    def test_unknown_size_fails(self):
        board = example()
        board["shots"][0]["size"] = "huge"
        self.assertTrue(any("unknown size" in f for f in self.fails(board)))

    def test_beat_outside_shot_fails(self):
        board = example()
        board["shots"][0]["beats"] = [9]
        self.assertTrue(any("outside the shot" in f for f in self.fails(board)))

    def test_jump_cut_warns(self):
        board = example()
        board["shots"][1].update(size="extreme-wide", angle="high")
        self.assertTrue(any("jump cut" in w for w in self.warns(board)))

    def test_no_callback_warns(self):
        board = example()
        board["shots"][-1]["callback"] = False
        self.assertTrue(any("call back" in w for w in self.warns(board)))

    def test_page_builds_with_the_words_on_it(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = pathlib.Path(tmp) / "board.html"
            run = subprocess.run([sys.executable, str(SKILL_DIR / "scripts/storyboard_page.py"), str(EXAMPLE), "--out", str(out)], capture_output=True, text=True)
            self.assertEqual(run.returncode, 0, run.stderr)
            page = out.read_text()
            self.assertIn("He saw them the whole time.", page)
            self.assertEqual(page.count("<article>"), 3)
            self.assertIn("<svg", page)

    def test_page_uses_a_drawn_sketch_when_one_exists(self):
        sys.path.insert(0, str(SKILL_DIR / "scripts"))
        from sketch import Frame
        with tempfile.TemporaryDirectory() as tmp:
            folder = pathlib.Path(tmp)
            board = folder / "storyboard.json"
            board.write_text(EXAMPLE.read_text())
            Frame("night").stars(5).word("drawn frame", 135, 200).write(folder / "frames/S01.svg")
            out = folder / "board.html"
            run = subprocess.run([sys.executable, str(SKILL_DIR / "scripts/storyboard_page.py"), str(board), "--out", str(out)], capture_output=True, text=True)
            self.assertEqual(run.returncode, 0, run.stderr)
            self.assertIn("drawn frame", out.read_text())


class Motion(unittest.TestCase):
    def test_a_point_on_the_camera_line_lands_at_the_centre(self):
        camera = (TEMPLATES / "camera.js").as_uri()
        q = node(f"import {{cam,proj}} from '{camera}'; console.log(JSON.stringify(proj(cam([0,1,10],[0,1,0],1.3),[0,1,0])))")
        self.assertAlmostEqual(q["x"], 540)
        self.assertAlmostEqual(q["y"], 960)
        self.assertAlmostEqual(q["z"], 10)

    def test_twice_as_far_is_half_the_size(self):
        camera = (TEMPLATES / "camera.js").as_uri()
        q = node(f"import {{cam,proj}} from '{camera}'; const c=cam([0,1,10],[0,1,0],1.3); console.log(JSON.stringify([proj(c,[0,1,5]).s,proj(c,[0,1,-10]).s]))")
        self.assertAlmostEqual(q[0], q[1] * 4)

    def test_camera_holds_inside_its_shot(self):
        camera = (TEMPLATES / "camera.js").as_uri()
        q = node(f"import {{cam,v3,camAt}} from '{camera}'; const s={{a:2,b:4,cam:(u)=>cam(v3([0,0,0],[2,0,0],u),[0,0,-1])}}; console.log(JSON.stringify([camAt(s,1).ro[0],camAt(s,3).ro[0],camAt(s,9).ro[0]]))")
        self.assertEqual(q, [0, 1, 2])

    def test_reach_lands_on_its_target(self):
        motion = (TEMPLATES / "motion.js").as_uri()
        code = f"import {{ik}} from '{motion}'; const a=.29,b=.28,[A,B]=ik(.2,.3,a,b,1); const x=-Math.sin(A)*a-Math.sin(A+B)*b,y=Math.cos(A)*a+Math.cos(A+B)*b; console.log(JSON.stringify([x,y]))"
        q = node(code)
        self.assertAlmostEqual(q[0], 0.2, places=6)
        self.assertAlmostEqual(q[1], 0.3, places=6)

    def test_sampled_track_stays_inside_the_node(self):
        motion = (TEMPLATES / "motion.js").as_uri()
        q = node(f"import {{sampled}} from '{motion}'; console.log(JSON.stringify(sampled('offsetX',2,1,(t)=>t*10).keyframes))")
        self.assertLess(q[-1]["at"], 1)
        self.assertAlmostEqual(q[0]["value"], 20)
        self.assertTrue(all(a["at"] < b["at"] for a, b in zip(q, q[1:])))

    def test_verb_peaks_after_its_word_and_settles(self):
        motion = (TEMPLATES / "motion.js").as_uri()
        q = node(f"import {{act}} from '{motion}'; console.log(JSON.stringify(act(1,3)))")
        self.assertEqual(q[0][1], 0)
        self.assertLess(q[1][1], 0)
        self.assertAlmostEqual(q[1][0], 2)
        self.assertGreater(q[2][1], 1)
        self.assertEqual(q[3][1], 1)

    def test_caption_groups_cover_every_word_in_order(self):
        motion = (TEMPLATES / "motion.js").as_uri()
        words = "He saw them. And then he came to them on the water that night.".split()
        timing = [{"s": i * 0.4, "e": i * 0.4 + 0.3} for i in range(len(words))]
        q = node(f"import {{groupCaptions}} from '{motion}'; console.log(JSON.stringify(groupCaptions({json.dumps(words)},{json.dumps(timing)})))")
        self.assertEqual(sum(g["count"] for g in q), len(words))
        self.assertEqual(q[0]["count"], 3)
        self.assertLessEqual(max(g["count"] for g in q), 5)
        for a, b in zip(q, q[1:]):
            self.assertEqual(a["from"] + a["count"], b["from"])
            self.assertLessEqual(a["t1"], b["t0"])

    def test_caption_groups_refuse_mismatched_timing(self):
        motion = (TEMPLATES / "motion.js").as_uri()
        with self.assertRaises(AssertionError):
            node(f"import {{groupCaptions}} from '{motion}'; groupCaptions(['a','b'],[{{s:0,e:1}}]); console.log('[]')")


if __name__ == "__main__":
    unittest.main(verbosity=1)
