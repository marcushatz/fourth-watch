# Bronze Serpent source

**What this is:** the code for the Nov 3 film, the placeholder puppet test and the identity proof. It's the pilot for the one-idea system.

| Folder | Holds |
|---|---|
| `edit/` | The 58.7 s film: shots, cast, type, shaders, score and mix |
| `puppet/` | The 7 s placeholder puppet: pose file, composite, plate and terrain |
| `proof/` | The five-frame identity proof, including the code-drawn gold calf |

`SHA256SUMS` lists each file's hash. These files were recovered from the Higgsfield sandbox and matched by hash on Nov 3, 2026. The code in the repo is the record. Heavy media stays in Higgsfield.

## Resume in a fresh session

Everything here is free. Nothing below calls a paid tool.

1. Read `../episode.json` for where the episode stands.
2. In `sandbox_exec` with `size: "xl"`, paste `restore.sh` into a file and run it.
3. If the repo has newer code than the source zip, copy the changed files into the sandbox.
4. Work under `/home/user/what-if/fw-serpent/`.

## Common jobs

Run long jobs with `background: true`. Each background job stops at 15 minutes.

| Job | Command, from the folder named |
|---|---|
| Puppet frame | `puppet`: `PT_PLATE=$PWD/pl_f.mp4 FW_INT=1 FW_DIR=/tmp/x higgsedit build test.jsx`, then `higgsedit frame pt 4.5 --out $PWD/check.png` |
| Puppet video | `puppet`: same build, then `higgsedit render pt --out $PWD/t.mp4 --workers 4 --bitrate 14M` |
| Puppet plate, draft | `puppet`: `FW_SMALL=1 higgsedit build plate.jsx`, then `higgsedit frame pl_s 3.3 --out $PWD/plate.png` |
| Puppet plate, final | `puppet`: `higgsedit build plate.jsx`, then `higgsedit render pl_f --out $PWD/pl_f.mp4 --workers 4 --bitrate 26M` |
| Film frame | `edit`: `FW_PLATE=$PWD/plate30.mp4 higgsedit build film.jsx`, then `higgsedit frame comp 20 --out $PWD/check.png` |
| Identity proof | `proof`: build and frame `f1`, `f2` and `f5`, extract `f4.png` from the puppet video, then build `proof.jsx` and frame `proof_c` |

`--out` needs an absolute path, or the file lands inside the project folder.

## What the code can't tell you

- Generated art for the film is in the media zip under `art/`.
- `film.jsx` still has `FW_INT` test code. It's off unless that variable is set, and it doesn't affect the delivered film.
- The film uses the experimental narration, not the candidate script.
