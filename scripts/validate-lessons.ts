import axios from 'axios';
import { LessonsArraySchema, LessonDetailSchema } from '../src/types/lessonSchemas';

type Args = {
  baseUrl: string;
  moduleRef: string;
  lang?: string;
  userId?: string;
  limit?: number;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const [k, v] = argv[i].includes('=') ? argv[i].split('=') : [argv[i], argv[i + 1]];
    if (k.startsWith('--')) {
      args[k.replace(/^--/, '')] = v ?? 'true';
      if (!argv[i].includes('=') && v !== undefined) i++;
    }
  }

  const baseUrl = args.baseUrl || process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000';
  const moduleRef = args.moduleRef;
  if (!moduleRef) {
    console.error('Usage: npm run validate:lessons -- --moduleRef=a0.basics [--baseUrl=http://...] [--lang=ru] [--userId=123] [--limit=10]');
    process.exit(1);
  }
  const lang = args.lang;
  const userId = args.userId;
  const limit = args.limit ? Number(args.limit) : undefined;
  return { baseUrl, moduleRef, lang, userId, limit };
}

function buildQuery(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function main() {
  const { baseUrl, moduleRef, lang, userId, limit } = parseArgs();
  const v2LessonsUrl = `${baseUrl}/content/v2/modules/${encodeURIComponent(moduleRef)}/lessons${buildQuery({ lang, userId })}`;

  const listResp = await axios.get(v2LessonsUrl).catch(async (e) => {
    // fallback to legacy
    const legacyUrl = `${baseUrl}/content/lessons${buildQuery({ moduleRef, lang, userId })}`;
    console.warn(`v2 endpoint failed, falling back: ${legacyUrl}`);
    return axios.get(legacyUrl);
  });

  const listData = Array.isArray(listResp.data) ? listResp.data : listResp.data?.lessons;
  const listParse = LessonsArraySchema.safeParse(listData);
  if (!listParse.success) {
    console.error('LessonSummary validation failed');
    console.error(listParse.error.format());
    process.exit(2);
  }
  const lessons = listParse.data;
  // Enumerate fields presence
  const fieldPresence = new Map<string, number>();
  for (const l of lessons) {
    Object.keys(l).forEach((k) => fieldPresence.set(k, (fieldPresence.get(k) || 0) + 1));
  }

  // Validate details
  const sample = limit ? lessons.slice(0, limit) : lessons;
  const detailErrors: Array<{ lessonRef: string; error: unknown }> = [];
  for (const l of sample) {
    const v2DetailUrl = `${baseUrl}/content/v2/lessons/${encodeURIComponent(l.lessonRef)}${buildQuery({ lang, userId })}`;
    let detailResp;
    try {
      detailResp = await axios.get(v2DetailUrl);
    } catch {
      const legacyDetailUrl = `${baseUrl}/content/lessons/${encodeURIComponent(l.lessonRef)}${buildQuery({ lang, userId })}`;
      detailResp = await axios.get(legacyDetailUrl);
    }
    const detailData = detailResp.data?.lesson ?? detailResp.data;
    const parsed = LessonDetailSchema.safeParse(detailData);
    if (!parsed.success) {
      detailErrors.push({ lessonRef: l.lessonRef, error: parsed.error.format() });
    }
  }

  if (detailErrors.length > 0) {
    console.error(`[3/3] LessonDetail validation failed for ${detailErrors.length} lesson(s)`);
    for (const e of detailErrors) {
      console.error('—', e.lessonRef, e.error);
    }
    process.exit(3);
  }

}

main().catch((e) => {
  console.error('Unexpected error', e);
  process.exit(10);
});


