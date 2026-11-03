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
2. Get the media base. Call `media_confirm` with the puppet test's ID from `episode.json` and type `video`. The folder part of the returned URL, without the file name, is `FW_MEDIA_BASE`. The link stays out of this repo because the repo is treated as public.
3. In `sandbox_exec` with `size: "xl"`, paste `restore.sh` into a file and run it. Pass a new folder as its first argument to test a restore. With no argument it restores to `/home/user/what-if`, and it refuses to overwrite that folder unless `FW_FORCE=1`.
4. Run `sha256sum -c SHA256SUMS` logic against the restored code. With a non-default root, files containing that path will differ. For any other file that differs, the repo's copy wins, so copy it into the sandbox.
5. Work under `fw-serpent/` in that root.

**Quick check:** the draft plate frame below should give a PNG whose SHA-256 begins `19a11f637b455417`.

## Common jobs

Run long jobs with `background: true`. Each background job stops at 15 minutes. `--out` needs an absolute path, or the file lands inside the project folder.

| Job | Run from | Commands |
|---|---|---|
| Puppet plate, draft | `puppet` | `FW_SMALL=1 higgsedit build plate.jsx`, then `higgsedit frame pl_s 3.3 --out $PWD/plate.png` |
| Puppet plate, final | `puppet` | `higgsedit build plate.jsx`, then `higgsedit render pl_f --out $PWD/pl_f.mp4 --workers 4 --bitrate 26M` |
| Puppet frame | `puppet` | `PT_PLATE=$PWD/pl_f.mp4 higgsedit build test.jsx`, then `higgsedit frame pt 4.5 --out $PWD/check.png` |
| Puppet video | `puppet` | Same build, then `higgsedit render pt --out $PWD/t3.mp4 --workers 4 --bitrate 14M` |
| Film frame | `edit` | `FW_PLATE=$PWD/plate30.mp4 higgsedit build film.jsx`, then `higgsedit frame comp 20 --out $PWD/check.png` |
| Identity proof | `proof` | Build `f1`, `f2` and `f5`, and frame each project at 0.3 into `f1.png`, `f2.png` and `f5.png`. Extract `f4.png` from the puppet video at 6.3 s with ffmpeg. Build `proof.jsx`, then frame `proof_c` at 0.5, 1.5, 2.5, 3.5 and 4.5 |

## What the code can't tell you

- Generated art for the film is in the media zip under `art/`.
- `film.jsx` and `cast.jsx` still have `FW_INT` test code. It's off unless that variable is set, and it doesn't affect the delivered film.
- `f4.png` needs the puppet video, which isn't in the zips. Render it, or download it by the media ID in `episode.json`.
- The film uses the experimental narration, not the candidate script.
