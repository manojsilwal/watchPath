import fetch from 'node-fetch';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';
const TVMAZE_BASE_URL = 'https://api.tvmaze.com';
/** TMDB id for the 2025 *F1* film — used for curated search + poster when API key is set. */
const F1_TMDB_MOVIE_ID = '911430';
/** Reliable fallback when TMDB is unavailable; Wikimedia hotlinks often 400/404 (non‑standard thumb sizes / path drift). */
const F1_POSTER_FALLBACK = 'https://placehold.co/500x750/312e81/c7d2fe?text=F1+%282025%29';

async function resolveF1MoviePosterUrl(): Promise<string> {
  if (TMDB_API_KEY && TMDB_API_KEY !== 'replace_me') {
    try {
      const res = await fetch(`${BASE_URL}/movie/${F1_TMDB_MOVIE_ID}?api_key=${TMDB_API_KEY}`);
      if (res.ok) {
        const data = (await res.json()) as { poster_path?: string | null };
        if (data.poster_path) {
          return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
        }
      }
    } catch {
      /* use fallback */
    }
  }
  return F1_POSTER_FALLBACK;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/** TVMaze-backed titles work whether or not TMDB is configured. */
async function getTitleFromTvmazeShowId(id: string) {
  const parts = id.split('_');
  if (parts.length !== 3 || parts[0] !== 'tvmaze' || parts[1] !== 'show') return null;
  const tvmazeId = parts[2];
  const response = await fetch(`${TVMAZE_BASE_URL}/shows/${tvmazeId}?embed=cast`);
  if (!response.ok) return null;
  const show = await response.json();

  const overview = show.summary ? stripHtml(show.summary) : '';
  const cast = (show._embedded?.cast || [])
    .slice(0, 12)
    .map((c: { person?: { name?: string } }) => c.person?.name)
    .filter(Boolean) as string[];

  return {
    titleId: id,
    title: show.name,
    year: show.premiered ? parseInt(show.premiered.split('-')[0]) : null,
    runtimeMinutes: show.averageRuntime || show.runtime || 0,
    posterUrl: show.image?.original || show.image?.medium || null,
    overview,
    genres: (show.genres || []) as string[],
    cast,
    directors: [] as string[],
    type: 'tv' as const,
    _tvmazeData: show,
  };
}

/** Curated hits merged into every search path — TMDB multi search often returns nothing for very short queries like "f1". */
async function curatedSearchExtras(query: string) {
  const q = query.toLowerCase();
  if (!q.includes('f1') && !q.includes('pitt')) return [];
  const posterUrl = await resolveF1MoviePosterUrl();
  return [
    {
      titleId: 'movie_f1_2025',
      title: 'F1',
      year: 2025,
      type: 'movie',
      posterUrl,
      matchConfidence: 0.99,
    },
  ];
}

function mergeSearchResults(
  extras: Awaited<ReturnType<typeof curatedSearchExtras>>,
  rest: { titleId: string; title: string; year: number | null; type: string; posterUrl: string | null; matchConfidence: number }[],
) {
  const seen = new Set(extras.map((e) => e.titleId));
  const deduped = rest.filter((r) => !seen.has(r.titleId));
  return [...extras, ...deduped];
}

export const tmdbService = {
  async search(query: string) {
    const extras = await curatedSearchExtras(query);

    if (TMDB_API_KEY === 'replace_me' || !TMDB_API_KEY) {
      const response = await fetch(`${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      const tvMazeResults = (data || []).slice(0, 10).map((r: any) => {
        const show = r.show;
        return {
          titleId: `tvmaze_show_${show.id}`,
          title: show.name,
          year: show.premiered ? parseInt(show.premiered.split('-')[0]) : null,
          type: 'show',
          posterUrl: show.image?.medium || null,
          matchConfidence: r.score,
        };
      });

      return mergeSearchResults(extras, tvMazeResults);
    }

    const response = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`);
    const data = await response.json();
    const tmdbMapped = (data.results || []).map((r: any) => ({
      titleId: `tmdb_${r.media_type}_${r.id}`,
      title: r.title || r.name,
      year: r.release_date ? parseInt(r.release_date.split('-')[0]) : r.first_air_date ? parseInt(r.first_air_date.split('-')[0]) : null,
      type: r.media_type,
      posterUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      matchConfidence: 0.9,
    }));
    return mergeSearchResults(extras, tmdbMapped);
  },

  async getTitle(id: string) {
    const tvmazeTitle = await getTitleFromTvmazeShowId(id);
    if (tvmazeTitle) return tvmazeTitle;

    if (id === 'movie_f1_2025') {
      const posterUrl = await resolveF1MoviePosterUrl();
      return {
        titleId: id,
        title: 'F1',
        year: 2025,
        runtimeMinutes: 140,
        posterUrl,
        overview: '',
        genres: [] as string[],
        cast: [] as string[],
        directors: [] as string[],
        type: 'movie' as const,
        _movieData: {
          providerName: 'Apple TV+',
          url: 'https://tv.apple.com',
          accessType: 'subscription',
        },
      };
    }

    if (TMDB_API_KEY === 'replace_me' || !TMDB_API_KEY) {
      return null;
    }

    const parts = id.split('_');
    if (parts.length !== 3 || parts[0] !== 'tmdb') return null;
    const type = parts[1];
    const tmdbId = parts[2];

    const response = await fetch(
      `${BASE_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );
    if (!response.ok) return null;

    const data = await response.json();
    const credits = data.credits;
    const castNames = (credits?.cast || [])
      .slice(0, 12)
      .map((c: { name?: string }) => c.name)
      .filter(Boolean) as string[];
    const directors = (credits?.crew || [])
      .filter((c: { job?: string }) => c.job === 'Director')
      .map((c: { name?: string }) => c.name)
      .filter(Boolean) as string[];
    const creators = (data.created_by || [])
      .map((c: { name?: string }) => c.name)
      .filter(Boolean) as string[];

    return {
      titleId: id,
      title: data.title || data.name,
      year: data.release_date
        ? parseInt(data.release_date.split('-')[0])
        : data.first_air_date
          ? parseInt(data.first_air_date.split('-')[0])
          : null,
      runtimeMinutes: data.runtime || data.episode_run_time?.[0] || 0,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      overview: data.overview || '',
      genres: (data.genres || []).map((g: { name: string }) => g.name),
      cast: castNames,
      directors: directors.length ? directors : creators,
      type: type === 'tv' ? ('tv' as const) : ('movie' as const)
    };
  }
};
