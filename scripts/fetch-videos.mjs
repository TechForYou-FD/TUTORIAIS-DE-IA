#!/usr/bin/env node
/**
 * Fetches the latest videos for the TechForYou playlists and writes
 * data/videos.json, which the static site reads at runtime.
 *
 * - If a YOUTUBE_API_KEY env var / secret is available, uses the YouTube
 *   Data API v3 (paginated) to fetch the FULL playlist contents.
 * - Otherwise falls back to each playlist's public RSS feed, which needs
 *   no API key but only exposes the ~15 most recent videos.
 *
 * Run by .github/workflows/update-videos.yml on a schedule, and safe to
 * run locally: `node scripts/fetch-videos.mjs`.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'data', 'videos.json');

const CHANNEL = {
  name: 'TechForYou',
  handle: '@TechForYou-ww3zt',
  url: 'https://www.youtube.com/@TechForYou-ww3zt',
};

const PLAYLISTS = [
  {
    id: 'PL5FIAcrKghKZ3Pc1V4dNotyh_uJejn8sC',
    title: 'Lives de IA',
    slug: 'lives-de-ia',
  },
  {
    id: 'PL5FIAcrKghKZ4rNcGt5yGAI4xfQ9c0L5l',
    title: 'Uso Inteligente de IA',
    slug: 'uso-inteligente-de-ia',
  },
];

const API_KEY = process.env.YOUTUBE_API_KEY;

async function fetchViaApi(playlistId) {
  const videos = [];
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', API_KEY);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
    const data = await res.json();

    for (const item of data.items ?? []) {
      const s = item.snippet;
      if (!s || s.title === 'Private video' || s.title === 'Deleted video') continue;
      const videoId = s.resourceId?.videoId;
      if (!videoId) continue;
      const thumb = s.thumbnails?.maxres || s.thumbnails?.high || s.thumbnails?.medium || s.thumbnails?.default;
      videos.push({
        id: videoId,
        title: s.title,
        publishedAt: s.publishedAt,
        thumbnail: thumb?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return videos;
}

async function fetchViaRss(playlistId) {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);
  if (!res.ok) throw new Error(`RSS error ${res.status} for playlist ${playlistId}`);
  const xml = await res.text();

  const videos = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRe.exec(xml))) {
    const block = match[1];
    const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const published = block.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!videoId || !title) continue;
    videos.push({
      id: videoId,
      title: decodeXmlEntities(title),
      publishedAt: published || null,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return videos;
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function main() {
  const playlists = [];

  for (const playlist of PLAYLISTS) {
    let videos = [];
    try {
      videos = API_KEY ? await fetchViaApi(playlist.id) : await fetchViaRss(playlist.id);
      console.log(`[fetch-videos] ${playlist.title}: ${videos.length} vídeos (${API_KEY ? 'API' : 'RSS'})`);
    } catch (err) {
      console.error(`[fetch-videos] Falha ao obter "${playlist.title}":`, err.message);
    }
    playlists.push({
      id: playlist.id,
      title: playlist.title,
      slug: playlist.slug,
      url: `https://youtube.com/playlist?list=${playlist.id}`,
      videos,
    });
  }

  const output = {
    updatedAt: new Date().toISOString(),
    channel: CHANNEL,
    playlists,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`[fetch-videos] Escrito em ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('[fetch-videos] Erro fatal:', err);
  process.exitCode = 1;
});
