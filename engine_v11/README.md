# Fourth Watch — Production Research Engine v11 (native Three.js bridge)

**Engineering proof, not a finished film.**

The original verified v10 VTK renderer and its 48-second storm layout workprint
are retained. v11 adds a deterministic state-export bridge and a native
`SCENES.storm_native.build/frame` Three.js implementation compatible with the
existing Fourth Watch `film27` renderer API.

**84 tests discovered: 83 passed, 1 skipped.** Original VTK movie provenance
remains valid; native browser rendering has **not** been certified. The film
is not approved for release and no production credits were spent.

First read `docs/V11_NATIVE_BRIDGE_AND_VERIFICATION.md` and
`native_three/README.md`. For original production limitations and v10's layout
proof see `docs/V10_IMPLEMENTATION_AND_TESTS.md`.

```bash
python -m unittest discover -s tests -q
python scripts/export_native_three.py examples/pilot-storm/shotplan.yaml --out native_three
python scripts/package_audit.py
```

The source-built shot plan remains `examples/pilot-storm/shotplan.yaml`.
The new bridge keeps the original voice unapproved and never publishes or spends
credits. The next gate is a real native `LW.render` shot comparison in the
existing GitHub `film27` checkout, not another standalone prototype.
