# Animation grammar and library requirements

## Character acting is authored, not simply procedural
1. **Intention**: what does the person seek in this moment? Visualize only what the text supports.
2. **Staging**: set action line, physical support, prop ownership and spatial constraints.
3. **Anticipation**: pose/weight shift before a significant movement when physically appropriate.
4. **Action**: readable silhouette changes and correctly timed contact with props.
5. **Response**: show consequence on nearby character/prop/place. Often this is the real storytelling beat.
6. **Settle**: length according to emotion—do not mechanically inject a reaction on every line.

## Reusable animation verbs and required parameters
`walk`, `turn`, `look`, `reach`, `grip`, `pull`, `push`, `row`, `kneel`, `stand`, `stumble`, `fall`, `rise`, `brace`, `cover`, `release`, `point`, `offer`, `receive`, `gather`, `separate`, `lift`, `lower`, `step`, `pause`.
Each verb exposes: `actor_id`, target `world_xyz` or `target_id`, start/end frame, contact/foot lock (when appropriate), root-motion path, facing, physical ease, overshoot/settle, prop parenting and continuity state. Actions are reusable; performance nuances remain shot-specific.

## Motion quality checks
- No foot skating during planted steps; contact leg position must hold in world space.
- No object floating at contact: grip/hand and prop must meet in 3D or 2D rig space.
- No impossible character intersections, limb clipping, body flipping, camera penetration or camera passing through geometry.
- Objects should respect scale consistency across cuts.
- Poses read as silhouettes at 360px wide.
- Movement must have a cause; motion on a static text card does not make it a story action.

## Transition devices and when they earn their cost
- `hard_cut`: new fact, new reaction, temporal change, sharp contrast.
- `match_shape`: same shape becomes another image, often a motif.
- `match_motion`: motion direction continues through cut.
- `occlusion_wipe`: moving foreground naturally obscures scene change.
- `camera_travel`: 2.5D/3D continuous journey between meaningfully adjacent places.
- `graphic_morph`: object transforms into diagram or verse detail; evidence must survive transform.
- `dissolve`: memory, passage of time, gentle emotional contrast; avoid muddy composite.
- `dip_to_dark`: a real gap or emotional descent, sparingly.
- `sound_bridge`: motivated sound begins before next visual or resolves after cut.
- `smash_cut`: deliberate discontinuity marking impact; costly if overused.

## Render implementation principles
Use deterministic functions of absolute frame/time (no hidden cumulative state) for reproducible render segments. Seeds, source asset hashes, shot schema, timeline mapping and color management belong in the shot manifest. Segment renders at whole frames, with explicit overlap only for transitions and crossfades; verify joins framewise and aurally. Be wary of different interpolation kernels / fps in clips.
