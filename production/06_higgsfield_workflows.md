# 06 · Higgsfield workflows and approved models

Findings from Nov 2, 2026. **Only the voice and assembly tools below have been tried on Fourth Watch.** Everything marked "untested" comes from the catalog or official pages, not from results.

Every paid use goes through `GENERATION_APPROVAL.md`.

## The route for Fourth Watch

```
Approved script → voice take → storyboard
→ approved stills (generate_image, with references)
→ layers (Image Decompose) → motion, type and sound in Higgsedit
→ image-to-video only for a few hero shots, if a test earns it
```

Every video is built with Higgsedit (Marcus, Nov 5), and code draws as much as quality allows. Generated art or video is used when it materially improves a scene, with approval. Other tools are welcome when they produce a better result.

## Tool findings

| Tool | Finding | Status |
|---|---|---|
| **Content Factory** | Built for "what-if" shorts. It takes a prompt, the session running it writes the script, and it forbids generated images, so every frame is drawn in code. Its own instructions exclude narrated explainers with AI-generated scenes | **Rejected for episodes** |
| **Higgsedit** (assembly) | 949 frames at 1080×1920 rendered in about 3 minutes in an XL sandbox, with no credit charge. Handles timed captions, verse cards, shake and flash | **Approved for assembly** |
| **Eleven v4** (voice) | 86-word take cost 2.76 credits. Word-for-word match on the first take | **Approved for tests.** The series voice isn't chosen |
| **Faceless Video workflow** | Keeps a pasted script word for word. Locked to Seedream 5.0 Pro stills and MiniMax H3 clips in 10 s blocks. About 240 credits of video alone for script v4, above the current balance. It is automation-first and forbids hand assembly | Script-safe, but not the default |
| **Recraft V4.1** | Available here. Palette control with hex colours. No image references | Untested |
| **Recraft V4 Styles** | Needs a saved custom style. None exist, and none of these tools can create one | Unavailable until a style exists |
| **Popcorn** | Not in the catalog or marketplace these tools can reach. On higgsfield.ai it makes up to 8 connected frames from up to 4 references. Higgsfield warns style can drift between frames | Can't be tested from here. Trial credits don't work on the website |
| **Image-to-video** | Many models accept a start image. Some accept start and end frames | Untested on our art |
| **Image Decompose** | Splits one image into layers for parallax | Untested |
| **Higgsfield Elements** | Reusable characters, sets and props. Supports Nano Banana Pro, Nano Banana 2, GPT Image 2, Seedream 4.5 and 5.0 Lite, Cinema Studio Image 2.5 | Untested |

**Does any of this beat Content Factory?** On control, yes: these routes can use a locked script and real illustration. On results, nobody knows yet. Only reviewed test frames can answer that.

## Candidate models

**No image or video model is approved yet.** A model is approved only after Marcus accepts its output, and the result goes in `09_approved_and_rejected.md`.

Prices are from free cost checks on Nov 2, 2026, at 9:16. Prices change, so always re-check with Marcus's OK before quoting.

### Images (one image)

| Model | Setting | Credits | Why consider it |
|---|---|---|---|
| Soul Cinema | 2K | 1 | Concept-art stills. One reference image |
| Recraft V4.1 | Standard, 1K | 1.25 | Cheap illustration test |
| Nano Banana Pro | 2K | 2 | Accepts references, supports Elements |
| Seedream 5.0 Pro | 2K | 2.5 | Instruction-based editing |
| GPT Image 2.5 | Flare, high, 2K | 2.75 | General default, reference editing |
| FLUX 3 Image | 2K | 3 | Up to 10 reference images |
| Ideogram 4.5 | High, 2K | 6.25 | Up to 5 source images |
| Recraft V4.1 | Standard, 2K | 8 | Palette control at high resolution |
| Recraft V4.1 | Vector, 2K | 10 | Logos and icons |

### Image editing

| Tool | Credits |
|---|---|
| Image Decompose, standard | 2 per image |

### Video (5 s, silent where the option exists)

| Model | Setting | Credits | Notes |
|---|---|---|---|
| Kling 3.0 Omni Frames | Standard | 5 | Start and end frames |
| Kling 3.0 | Standard | 7.5 | Start and end frames |
| Kling 3.0 Turbo | 720p | 7.5 | Start frame only |
| Kling 3.0 | Pro | 8.75 | Start and end frames |
| MiniMax H3 | 2K | 10 (20 for 10 s) | Keyframes and references |
| Kling 4.0 | 720p | 11.25 | Keyframes and references |
| Seedance 2.0 | Fast, 720p | 12.5 | References |
| MiniMax H3 Max | 768p | 12.5 | Keyframes and references |
| Cinema Studio 3.0 | 720p | 25 | Start and end frames |
| FLUX 3 Video | 720p | 30 | Multiple frames |
| Seedance 2.5 | 720p | 35 | Many reference types |

## Prompt rules

- Lead with the medium and style, then the scene, composition and light.
- Reuse the approved style block word for word.
- Include: no text, no letters, no logos.
- Reserve clear space for typography.
- For image-to-video, ask for one simple camera or subject move. Keep it short.

## Rights

**Higgsfield** (help page, checked Nov 2, 2026, page dated Aug 2, 2026): "You own your outputs." "The Terms of Use do not restrict commercial use of outputs." Indemnification against third-party claims is Enterprise-only.

**Still to verify** before release: whether anything further applies to Eleven v4 voices made through Higgsfield. Older notes on ElevenLabs terms are in `DECISIONS.md`.
