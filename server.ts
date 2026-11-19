import express, { type Request, type Response } from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

type RenderFormat = 'mov' | 'webm';

interface AlphaRenderJob {
  id: string;
  dir: string;
  fps: number;
  width: number;
  height: number;
  totalFrames: number;
  format: RenderFormat;
  filename: string;
  status: 'uploading' | 'encoding' | 'done' | 'error';
  encodedFrames: number;
  outputPath: string | null;
  sizeBytes: number;
  error: string | null;
  createdAt: number;
}

const jobs = new Map<string, AlphaRenderJob>();

async function cleanupJob(jobId: string): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;
  jobs.delete(jobId);
  try {
    await fs.rm(job.dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < cutoff) {
      void cleanupJob(id);
    }
  }
}, 5 * 60 * 1000).unref();

function startBackgroundFfmpeg(job: AlphaRenderJob, args: string[], outputPath: string): void {
  job.status = 'encoding';
  job.encodedFrames = 0;

  const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  let stdoutBuffer = '';

  proc.stdout.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('frame=')) {
        const parsed = Number(trimmed.slice(6));
        if (Number.isFinite(parsed) && parsed >= 0) {
          job.encodedFrames = Math.min(job.totalFrames, parsed);
        }
      }
    }
  });

  proc.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
    if (stderr.length > 4000) {
      stderr = stderr.slice(-4000);
    }
  });

  proc.on('error', (err) => {
    job.status = 'error';
    job.error = err.message;
  });

  proc.on('close', async (code) => {
    if (code === 0) {
      try {
        const stat = await fs.stat(outputPath);
        job.outputPath = outputPath;
        job.sizeBytes = stat.size;
        job.encodedFrames = job.totalFrames;
        job.status = 'done';
      } catch (err) {
        job.status = 'error';
        job.error = err instanceof Error ? err.message : 'File hasil render tidak ditemukan';
      }
    } else {
      job.status = 'error';
      job.error = `FFmpeg gagal (kode ${code}): ${stderr.slice(-400)}`;
    }
  });
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.post(
    '/api/alpha-render/start',
    express.json({ limit: '1mb' }),
    async (req: Request, res: Response) => {
      try {
        const body = req.body as Partial<{
          fps: number;
          width: number;
          height: number;
          totalFrames: number;
          format: RenderFormat;
          filename: string;
        }>;

        const fps = Math.max(1, Math.min(120, Math.round(Number(body.fps) || 30)));
        const width = Math.max(64, Math.min(3840, Math.round(Number(body.width) || 1920)));
        const height = Math.max(64, Math.min(3840, Math.round(Number(body.height) || 1080)));
        const totalFrames = Math.max(1, Math.min(3600, Math.round(Number(body.totalFrames) || 300)));
        const format: RenderFormat = body.format === 'webm' ? 'webm' : 'mov';

        const baseName =
          String(body.filename || 'kinetik-alpha-video-only')
            .replace(/[^a-zA-Z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 64) || 'kinetik-alpha-video-only';

        const id = crypto.randomBytes(10).toString('hex');
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), `kinetik-alpha-${id}-`));

        const job: AlphaRenderJob = {
          id,
          dir,
          fps,
          width,
          height,
          totalFrames,
          format,
          filename: `${baseName}.${format}`,
          status: 'uploading',
          encodedFrames: 0,
          outputPath: null,
          sizeBytes: 0,
          error: null,
          createdAt: Date.now(),
        };
        jobs.set(id, job);

        res.json({ jobId: id });
      } catch (err) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Gagal memulai render Alpha',
        });
      }
    }
  );

  app.post(
    '/api/alpha-render/frame/:jobId/:index',
    express.raw({ type: 'image/png', limit: '25mb' }),
    async (req: Request, res: Response) => {
      const { jobId, index } = req.params;
      const job = jobs.get(String(jobId));
      if (!job) {
        res.status(404).json({ error: 'Job render tidak ditemukan' });
        return;
      }

      const frameIdx = Number(index);
      if (!Number.isInteger(frameIdx) || frameIdx < 0 || frameIdx >= job.totalFrames) {
        res.status(400).json({ error: 'Indeks frame tidak valid' });
        return;
      }

      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        res.status(400).json({ error: 'Data PNG frame kosong' });
        return;
      }

      const filePath = path.join(
        job.dir,
        `frame_${String(frameIdx).padStart(5, '0')}.png`
      );
      await fs.writeFile(filePath, buffer);
      res.json({ ok: true });
    }
  );

  // Starts FFmpeg encoding asynchronously in background so reverse proxies never time out
  app.post('/api/alpha-render/finish/:jobId', (req: Request, res: Response) => {
    const jobId = String(req.params.jobId);
    const job = jobs.get(jobId);
    if (!job) {
      res.status(404).json({ error: 'Job render tidak ditemukan' });
      return;
    }

    if (job.status === 'encoding' || job.status === 'done') {
      res.json({ ok: true, status: job.status });
      return;
    }

    const inputPattern = path.join(job.dir, 'frame_%05d.png');
    const outputPath = path.join(job.dir, `output.${job.format}`);

    const commonPrefix = [
      '-y',
      '-progress',
      'pipe:1',
      '-nostats',
      '-framerate',
      String(job.fps),
      '-i',
      inputPattern,
      '-an',
    ];

    const codecArgs =
      job.format === 'mov'
        ? [
            '-c:v',
            'prores_ks',
            '-profile:v',
            '4444',
            '-qscale:v',
            '9',
            '-alpha_bits',
            '16',
            '-pix_fmt',
            'yuva444p10le',
            '-vendor',
            'apl0',
            '-movflags',
            '+faststart',
            outputPath,
          ]
        : [
            '-c:v',
            'libvpx-vp9',
            '-pix_fmt',
            'yuva420p',
            '-deadline',
            'realtime',
            '-cpu-used',
            '8',
            '-row-mt',
            '1',
            '-b:v',
            '4M',
            '-auto-alt-ref',
            '0',
            outputPath,
          ];

    startBackgroundFfmpeg(job, [...commonPrefix, ...codecArgs], outputPath);
    res.json({ ok: true, status: 'encoding' });
  });

  app.get('/api/alpha-render/status/:jobId', (req: Request, res: Response) => {
    const jobId = String(req.params.jobId);
    const job = jobs.get(jobId);
    if (!job) {
      res.status(404).json({ error: 'Job render tidak ditemukan' });
      return;
    }

    res.json({
      status: job.status,
      encodedFrames: job.encodedFrames,
      totalFrames: job.totalFrames,
      downloadUrl:
        job.status === 'done' ? `/api/alpha-render/download/${job.id}` : null,
      filename: job.filename,
      sizeBytes: job.sizeBytes,
      error: job.error,
    });
  });

  app.get('/api/alpha-render/download/:jobId', (req: Request, res: Response) => {
    const jobId = String(req.params.jobId);
    const job = jobs.get(jobId);
    if (!job || !job.outputPath || job.status !== 'done') {
      res.status(404).json({ error: 'File hasil render belum siap atau tidak ditemukan' });
      return;
    }

    res.setHeader(
      'Content-Type',
      job.format === 'webm' ? 'video/webm' : 'video/quicktime'
    );
    res.download(job.outputPath, job.filename, () => {
      setTimeout(() => {
        void cleanupJob(jobId);
      }, 30_000).unref();
    });
  });

  app.get('/api/alpha-render/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.delete('/api/alpha-render/:jobId', async (req: Request, res: Response) => {
    await cleanupJob(String(req.params.jobId));
    res.json({ ok: true });
  });

  // Never fall through to SPA HTML for /api/* routes
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
  });

  if (isProd) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Kinetik Studio server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
