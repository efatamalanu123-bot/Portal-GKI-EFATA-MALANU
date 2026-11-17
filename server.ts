import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

type VerseTopic =
  | 'harian'
  | 'pengharapan'
  | 'kekuatan'
  | 'syukur'
  | 'damai'
  | 'pelayanan';

interface DailyVerseResponse {
  date: string;
  topic: VerseTopic;
  referensi: string;
  kitab: string;
  tema: string;
  isiAyat: string;
  refleksiSingkat: string;
  doaSingkat: string;
}

const TOPIC_DESCRIPTIONS: Record<VerseTopic, string> = {
  harian: 'inspirasi rohani harian untuk memulai hari bersama Tuhan',
  pengharapan: 'pengharapan dan iman di tengah pergumulan hidup',
  kekuatan: 'kekuatan, keberanian, dan keteguhan hati dari Tuhan',
  syukur: 'ucapan syukur atas kasih setia dan penyertaan Tuhan',
  damai: 'damai sejahtera, ketenangan hati, dan pengampunan',
  pelayanan: 'semangat melayani sesama dan jemaat dengan kasih Kristus',
};

const dailyVerseCache = new Map<string, DailyVerseResponse>();

function getSorongDateKey(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jayapura',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      'Kunci API Gemini belum tersedia di konfigurasi server (Settings > Secrets).'
    );
    (err as Error & { statusCode?: number }).statusCode = 500;
    throw err;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateDailyVerseWithRetry(
  dateKey: string,
  topic: VerseTopic,
  avoidRef?: string
): Promise<DailyVerseResponse> {
  const ai = getGeminiClient();
  const topicDesc = TOPIC_DESCRIPTIONS[topic];
  const avoidClause = avoidRef
    ? ` Pilih ayat yang BERBEDA dari "${avoidRef}".`
    : '';

  const prompt =
    `Berikan satu ayat Alkitab inspiratif untuk tanggal ${dateKey} dengan tema "${topic}" (${topicDesc}) bagi jemaat GKI Efata Malanu Sorong.` +
    avoidClause;

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah pelayan firman GKI di Tanah Papua. Pilih ayat Alkitab berbahasa Indonesia (Terjemahan Baru / LAI) yang akurat, penuh pengharapan, dan relevan. Tulis tema maksimal 4 kata, refleksi singkat maksimal 2 kalimat yang hangat, dan doa singkat 1 kalimat. Gunakan bahasa Indonesia yang baku dan menyejukkan.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              referensi: {
                type: Type.STRING,
                description: 'Referensi ayat Alkitab, misalnya Mazmur 23:1-3 atau Filipi 4:13',
              },
              kitab: {
                type: Type.STRING,
                description: 'Nama kitab Alkitab dalam bahasa Indonesia, misalnya Mazmur',
              },
              tema: {
                type: Type.STRING,
                description: 'Tema singkat inspirasi ayat, maksimal 4 kata',
              },
              isiAyat: {
                type: Type.STRING,
                description: 'Teks ayat Alkitab Terjemahan Baru dalam bahasa Indonesia',
              },
              refleksiSingkat: {
                type: Type.STRING,
                description: 'Renungan singkat pastoral 1-2 kalimat untuk jemaat',
              },
              doaSingkat: {
                type: Type.STRING,
                description: 'Satu kalimat doa penutup singkat',
              },
            },
            required: [
              'referensi',
              'kitab',
              'tema',
              'isiAyat',
              'refleksiSingkat',
              'doaSingkat',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Respons Gemini kosong saat mengambil ayat harian.');
      }
      const parsed = JSON.parse(rawText) as Omit<DailyVerseResponse, 'date' | 'topic'>;
      if (!parsed.referensi || !parsed.isiAyat) {
        throw new Error('Format ayat harian dari Gemini tidak lengkap.');
      }

      return {
        date: dateKey,
        topic,
        referensi: parsed.referensi.trim(),
        kitab: (parsed.kitab || '').trim(),
        tema: (parsed.tema || 'Firman Hari Ini').trim(),
        isiAyat: parsed.isiAyat.trim(),
        refleksiSingkat: (parsed.refleksiSingkat || '').trim(),
        doaSingkat: (parsed.doaSingkat || '').trim(),
      };
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }
  throw lastError;
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err || '');
  const statusCode =
    typeof err === 'object' && err !== null && 'statusCode' in err
      ? Number((err as { statusCode?: unknown }).statusCode)
      : typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as { status?: unknown }).status)
        : 500;

  if (
    statusCode === 400 ||
    statusCode === 403 ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('PERMISSION_DENIED')
  ) {
    return {
      status: statusCode === 403 ? 403 : 400,
      message:
        'Konfigurasi kunci API Gemini belum valid atau belum dipilih pada panel Settings > Secrets.',
    };
  }
  if (statusCode === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Kuota permintaan ayat harian sedang penuh. Silakan coba beberapa saat lagi.',
    };
  }
  if (statusCode === 404 || msg.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: 'Model Gemini yang diminta tidak ditemukan.',
    };
  }
  return {
    status: Number.isFinite(statusCode) && statusCode >= 400 ? statusCode : 500,
    message: msg || 'Gagal memuat ayat harian dari layanan Gemini.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/offline-manifest', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({
      routes: [
        '/',
        '/tata-ibadah',
        '/warta',
        '/jadwal',
        '/nyanyian',
        '/alkitab',
        '/layanan',
        '/keuangan',
        '/statistik',
        '/profil',
      ],
      assets: ['/warta-minggu-ini.pdf', '/icon.svg', '/pwa-192x192.png', '/pwa-512x512.png'],
      api: ['/api/daily-verse?topic=harian'],
      updatedAt: getSorongDateKey(),
    });
  });

  app.get('/api/daily-verse', async (req, res) => {
    const rawTopic = String(req.query.topic || 'harian').toLowerCase();
    const topic: VerseTopic =
      rawTopic in TOPIC_DESCRIPTIONS ? (rawTopic as VerseTopic) : 'harian';
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const avoid = typeof req.query.avoid === 'string' ? req.query.avoid.trim() : undefined;
    const dateKey = getSorongDateKey();
    const cacheKey = `${dateKey}:${topic}`;

    if (!refresh) {
      const cached = dailyVerseCache.get(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }
    }

    try {
      const verse = await generateDailyVerseWithRetry(dateKey, topic, avoid);
      dailyVerseCache.set(cacheKey, verse);
      res.json(verse);
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GKI Efata Malanu server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
