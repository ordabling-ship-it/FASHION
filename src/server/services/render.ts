import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const run = promisify(execFile);

export interface RenderArgs {
  ffmpeg: string;
  ffprobe: string;
  visualPath: string; // talking video (mp4) or still image
  visualIsVideo: boolean;
  audioPath: string;
  musicPath?: string;
  musicVolume: number;
  scriptText: string;
  title: string;
  priceLabel?: string;
  aiLabel: string;
  outPath: string;
}

export async function probeDuration(ffprobe: string, file: string): Promise<number> {
  const { stdout } = await run(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  const d = parseFloat(stdout.trim());
  if (!Number.isFinite(d)) throw new Error(`Could not read duration of ${file}`);
  return d;
}

/** Split spoken text into short caption chunks, timed proportionally to their length. */
export function buildCaptionCues(text: string, duration: number, wordsPerCue = 4) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerCue) chunks.push(words.slice(i, i + wordsPerCue).join(' '));
  const total = chunks.reduce((n, c) => n + c.length, 0) || 1;
  let t = 0;
  return chunks.map((c) => {
    const len = (c.length / total) * duration;
    const cue = { start: t, end: t + len, text: c };
    t += len;
    return cue;
  });
}

const assTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toFixed(2).padStart(5, '0');
  return `${h}:${String(m).padStart(2, '0')}:${sec}`;
};
const assEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/[{}]/g, '').replace(/\n/g, '\\N');

export function buildAss(args: { cues: { start: number; end: number; text: string }[]; duration: number; title: string; priceLabel?: string; aiLabel: string }) {
  const end = assTime(args.duration + 1);
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Sans,78,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,6,2,2,80,80,420,1
Style: Title,Sans,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,1,0,0,0,100,100,0,0,3,4,0,8,60,60,140,1
Style: Price,Sans,72,&H0000E1FF,&H00FFFFFF,&H00000000,&H99000000,1,0,0,0,100,100,0,0,3,4,0,8,60,60,240,1
Style: AiLabel,Sans,34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,0,0,0,0,100,100,0,0,3,2,0,7,40,40,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = [
    `Dialogue: 1,0:00:00.00,${end},AiLabel,,0,0,0,,${assEscape(args.aiLabel)}`,
    `Dialogue: 1,0:00:00.00,${end},Title,,0,0,0,,${assEscape(args.title)}`,
    ...(args.priceLabel ? [`Dialogue: 1,0:00:00.00,${end},Price,,0,0,0,,${assEscape(args.priceLabel)}`] : []),
    ...args.cues.map((c) => `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${assEscape(c.text.toUpperCase())}`),
  ];
  return header + lines.join('\n') + '\n';
}

/** Escape a path for use inside an ffmpeg filtergraph option value. */
const filterPath = (p: string) => p.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");

export async function renderReel(a: RenderArgs) {
  const duration = await probeDuration(a.ffprobe, a.audioPath);
  const dir = path.dirname(a.outPath);
  await fs.mkdir(dir, { recursive: true });
  const assPath = path.join(dir, 'captions.ass');
  await fs.writeFile(
    assPath,
    buildAss({ cues: buildCaptionCues(a.scriptText, duration), duration, title: a.title, priceLabel: a.priceLabel, aiLabel: a.aiLabel }),
  );

  const args = ['-y'];
  if (a.visualIsVideo) args.push('-stream_loop', '-1', '-i', a.visualPath);
  else args.push('-loop', '1', '-framerate', '30', '-i', a.visualPath);
  args.push('-i', a.audioPath);
  if (a.musicPath) args.push('-stream_loop', '-1', '-i', a.musicPath);

  const base = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1';
  const motion = a.visualIsVideo
    ? 'fps=30'
    : "zoompan=z='min(zoom+0.0007,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30";
  let graph = `[0:v]${base},${motion},subtitles='${filterPath(assPath)}',format=yuv420p[v]`;
  if (a.musicPath) {
    graph += `;[2:a]volume=${a.musicVolume}[m];[1:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]`;
  } else {
    graph += ';[1:a]anull[a]';
  }
  args.push(
    '-filter_complex', graph,
    '-map', '[v]', '-map', '[a]',
    '-t', (duration + 0.3).toFixed(2),
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-r', '30',
    '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart',
    '-metadata', `comment=${a.aiLabel}`,
    a.outPath,
  );
  await run(a.ffmpeg, args, { maxBuffer: 32 * 1024 * 1024 });
  return { path: a.outPath, duration };
}
