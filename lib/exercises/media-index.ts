import { normalizeExerciseName } from './resolve-media';

export interface MediaIndexEntry {
  slug: string;
  gif_url: string | null;
  image_url: string | null;
}

export type MediaIndex = Record<string, MediaIndexEntry>;

export function buildMediaIndex(
  rows: { slug: string; name_en: string; gif_url?: string | null; image_url?: string | null }[],
): MediaIndex {
  const index: MediaIndex = {};
  for (const row of rows) {
    index[normalizeExerciseName(row.name_en)] = {
      slug: row.slug,
      gif_url: row.gif_url ?? null,
      image_url: row.image_url ?? null,
    };
  }
  return index;
}

export function lookupMedia(name: string, index: MediaIndex): MediaIndexEntry | null {
  return index[normalizeExerciseName(name)] ?? null;
}
