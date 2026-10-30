# VTON Studio — automatic 9:16 fashion reels from a folder of photos

Drop clothing photos into a folder → get a ready-to-post vertical reel in which an AI model
enthusiastically presents the garment to her followers (voiceover, lip-sync, captions, music,
name + price overlay), plus script, caption/hashtags and metadata.

```
input/red-dress/front.jpg ─┐
input/red-dress/back.jpg  ─┤  0 prepare (sharp) → 1 analyze (Gemini) → 2 try-on (Fal.ai / Replicate) → 3 script (Gemini + TikTok trends)
input/jeans_front.png     ─┘  → 4 voice (ElevenLabs) → 5 lip-sync (Fal.ai) → 6 render (ffmpeg) → 7 output
                                                                     ↓
                    output/red-dress/{reel.mp4, script.txt, caption.txt, metadata.json, originals/}
                    input/processed/red-dress/   (source photos are moved here)
```

## Quick start (demo, no API keys)

Requirements: Node 20+, `ffmpeg` + `ffprobe` on PATH (built with libass — standard on most distros/Homebrew).

```bash
npm install
cp .env.example .env          # DEMO_MODE=true by default
mkdir -p input/red-dress && cp ~/Pictures/dress*.jpg input/red-dress/
npm run reels                 # process the folder once, no UI
npm run dev                   # or: UI + folder watcher on http://localhost:3000 → tab "Rolki"
```

In **DEMO_MODE** every AI step is a local mock: the "try-on" is your original photo, the voice is a
quiet tone and the script is a template. The UI shows a yellow DEMO banner and the reel carries a
`DEMO •` label. Nothing is sent to any external service.

## Real mode

Set `DEMO_MODE=false` and provide keys (startup fails with a clear message if one is missing):

| Step | Provider | Env |
|---|---|---|
| Garment analysis + script | Google Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Virtual try-on | Fal.ai CatVTON / IDM-VTON **or** Replicate IDM-VTON | `VTON_PROVIDER`, `FAL_KEY` / `REPLICATE_API_TOKEN`, `MODEL_AVATAR_PATH` |
| Voiceover | ElevenLabs | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` |
| Talking (lip-synced) video | Fal.ai (default `veed/fabric-1.0`) or `none` | `LIPSYNC_PROVIDER`, `FAL_LIPSYNC_MODEL` |
| Background music | local file | `MUSIC_PATH` (use royalty-free/licensed music) |

`MODEL_AVATAR_PATH` is a full-body photo of the model who "wears" the clothes. With
`LIPSYNC_PROVIDER=none` the reel is the try-on image with a slow zoom + voiceover.

## Two ways to add clothes (pick either)

1. **Folder on your computer** — drop photos into `INPUT_DIR` (watched while `npm run dev` runs, or
   process once with `npm run reels`).
2. **Upload up to 5 photos at once** — "Rolki" tab → *Wybierz lub upuść do 5 zdjęć* (or
   `POST /api/uploads`, multipart field `photos`, optional `name`, `price`, `currency`, `language`, `notes`).
   All photos in one upload = one item. More than `UPLOAD_MAX_FILES` or non-image files are rejected.

## Automatic image conversion

The first pipeline step (`prepare`) makes every photo safe for Gemini, the VTON models and ffmpeg:
EXIF auto-rotate, long side ≤ `IMAGE_MAX_SIDE` (2048 px), JPEG/WebP ≤ `IMAGE_MAX_BYTES` (4 MB; quality and
then size are reduced until it fits). HEIC/HEIF from iPhones is decoded with `heic-convert` (the prebuilt
`sharp` has no HEVC decoder). Files that are already fine are used as-is. Originals are never modified and
are copied to `output/<item>/originals/`.

## Trending hooks

Before writing the script, the `trends` module asks Gemini **with Google Search grounding** what hook
formats and hashtags are currently trending in TikTok fashion content for `TRENDS_REGION` (default `PL`).
The result is cached for 24 h in `DATA_DIR/trends.json` per region+language. If the search fails, a stale
cached result is used, otherwise a curated list of proven hook templates. The script prompt gets the top
hook styles (adapt one, don't copy) and trending hashtags; up to 5 trending hashtags are merged into the
caption. `GET /api/trends` shows the current set. In DEMO_MODE the curated list is used (source `mock`).

## Input folder conventions

- **Subfolder = item**: `input/red-dress/*.jpg`
- **Filename prefix = item**: `input/red-dress_front.jpg`, `input/red-dress_back.jpg` (text before the last `_`)
- Supported: jpg, jpeg, png, webp, heic/heif (HEIC is fine for Gemini; rendering a HEIC still in
  `LIPSYNC_PROVIDER=none`/demo mode requires an ffmpeg build that decodes HEIC — prefer JPG/PNG).
- Optional `info.json` in the item folder (or `input/<item>.json`) with trusted facts:

```json
{ "name": "Czerwona sukienka midi", "price": 149, "currency": "PLN", "language": "pl",
  "notes": "100% wiskoza, rozmiar M" }
```

The script is generated **only** from the analysis + these facts — the prompt forbids inventing
brand, material, price or discounts.

## Dashboard ("Rolki" tab)

Lists items and their status, shows live job progress and logs, previews the reel, lets you edit the
spoken script, regenerate it, and (re-)render. With `REVIEW_BEFORE_RENDER=true` the pipeline stops
after the script so you can approve/edit it before spending money on TTS and video.
The "Studio" tab upload now writes the photo into `INPUT_DIR` and runs the same pipeline with real
progress (no more fake timer).

## API

| Method | Path | |
|---|---|---|
| GET | `/api/health`, `/api/config` | status, demo flag, active providers (no secrets) |
| GET | `/api/items`, `/api/items/:id` | items (+ jobs) |
| PUT | `/api/items/:id/script` | `{ scriptText }` edit spoken script |
| POST | `/api/items/:id/regenerate-script` | new script job |
| POST | `/api/items/:id/render` | TTS → lip-sync → render → output job |
| POST | `/api/uploads` | multipart `photos` (1–5) + optional fields → one item `{ itemId, jobId }` |
| GET | `/api/trends` | current trending hooks/hashtags (cached) |
| POST | `/api/scan` | rescan `INPUT_DIR` |
| GET | `/api/jobs`, `/api/jobs/:id` | job status, progress, logs |
| POST | `/api/jobs/:id/retry` | retry a failed job from the failed step |
| POST | `/api/vton/generate` | Studio upload (data URL or https image) → `{ itemId, jobId }` |
| GET | `/media/<item>/reel.mp4` | generated files |

Jobs are persisted in `DATA_DIR/db.json` (single-process JSON queue with per-step retries and
exponential backoff; interrupted jobs resume on restart).

## Scripts

- `npm run dev` — server + Vite + folder watcher
- `npm run reels` — one-shot CLI (`npm run reels -- --dry-run` lists detected items)
- `npm test` — vitest (all providers mocked; needs ffmpeg for the pipeline tests)
- `npm run typecheck`, `npm run build`, `npm start`

## Code layout

```
server.ts                       entry (Vite in dev, static dist in prod, watcher)
src/server/config.ts            zod env validation
src/server/app.ts               express app, rate limit, error handling
src/server/routes/reels.ts      items/jobs/studio API (zod-validated)
src/server/routes/legacy.ts     simulated Stripe/BLIK + Vinted/OLX endpoints
src/server/providers/*          provider interfaces + Gemini, Fal, Replicate, ElevenLabs, mocks
src/server/services/pipeline.ts job queue + step orchestration
src/server/services/render.ts   ffmpeg 1080x1920 renderer (ASS captions/overlays, music mix)
src/server/services/folder.ts   grouping + info.json
src/server/services/images.ts   sharp/HEIC normalization
src/server/services/trends.ts   trending hooks (Gemini + Google Search, 24h cache, curated fallback)
src/server/services/watcher.ts  chokidar watcher
src/cli/reels.ts                `npm run reels`
```

## AI transparency (EU AI Act) and likeness rights

- The label is intentionally **kept but subtle**: a tiny, semi-transparent "Wygenerowano przez AI /
  AI-generated" text in the bottom-right corner (prefixed with `DEMO •` only in demo mode), plus the MP4
  `comment` tag and `aiGenerated: true` in `metadata.json`. The caption has no disclosure banner; instead
  `metadata.json → tiktok` contains `aiGeneratedContent: true` and a note to switch on TikTok's
  "AI-generated content" toggle when posting. Removing the disclosure entirely is not offered: TikTok's
  rules require labelling realistic AI-generated content (unlabelled content can be removed or
  down-ranked), and Art. 50 of the EU AI Act requires disclosure of AI-generated video and synthetic voices.
- **Likeness rights:** only use a model/avatar photo and a voice you own or have written consent to
  use for commercial, AI-generated advertising (in Poland the image is protected by art. 81 of the
  copyright act and personal rights in art. 23–24 KC). Do not clone a real person's face or voice
  without consent. Use licensed music.
- Ads must not be misleading: the script must reflect the real garment (that's why it's generated
  from the photo analysis and your `info.json` only — review it before posting).

## Still simulated

Payments (Stripe/BLIK) and Vinted/OLX listing in the storefront tabs are **not real** yet — they
return mock results. See TODO in the PR description.
